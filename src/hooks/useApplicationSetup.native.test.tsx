import React, { act } from 'react';

import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { type InitialRoute } from '@/navigation/initialRoute';
import Routes from '@/navigation/routesNames';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { useApplicationSetup } from './useApplicationSetup';

const services = vi.hoisted(() => ({
  load: vi.fn<() => Promise<void>>(),
  migrate: vi.fn<() => Promise<void>>(),
  context: vi.fn(),
  sentry: vi.fn(),
  collapse: vi.fn(),
  lateData: vi.fn(),
  integrity: vi.fn(),
}));

vi.mock('@sentry/react-native', () => ({ setUser: services.sentry }));
vi.mock('@/analytics', () => ({ analytics: { setWalletContext: services.context, identify: vi.fn() } }));
vi.mock('@/analytics/utils', () => ({ getDeviceId: () => 'device', securelyHashWalletAddress: () => 'wallet-hash' }));
vi.mock('@/features/backup/backup', () => ({ checkIdentifierOnLaunch: vi.fn() }));
vi.mock('@/features/wallet-connect/handlers/listeners', () => ({
  initListeners: vi.fn(async () => undefined),
  initWalletConnectPushNotifications: vi.fn(),
}));
vi.mock('@/features/wallet/data/walletScreen/base/walletListTogglesStore', () => ({
  walletListTogglesActions: { setToggle: services.collapse },
}));
vi.mock('@/model/migrations', () => ({ default: services.migrate }));
vi.mock('@/notifications/tokens', () => ({ saveFCMToken: vi.fn(async () => undefined) }));
vi.mock('@/performance/tracking', () => ({ PerformanceReports: {}, PerformanceTracking: { addReportParams: vi.fn() } }));
vi.mock('@/state/settings/loadGlobalLateData', () => ({ loadGlobalLateData: services.lateData }));
vi.mock('@/state/wallets/walletsStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  const { EthereumWalletType } = await import('@/helpers/walletTypes');
  const { EncryptionType } = await import('@/features/wallet/types');
  const wallet = {
    id: 'wallet',
    type: EthereumWalletType.mnemonic,
    encryptionType: EncryptionType.keychain,
    name: 'Wallet',
    color: 0,
    imported: false,
    primary: true,
    addresses: [],
  };
  const store = createBaseStore(() => ({
    selectedWalletId: '',
    accountAddress: '',
    wallets: { wallet },
    getSelectedWallet: () => (store.getState().selectedWalletId ? store.getState().wallets.wallet : null),
  }));
  return {
    useWalletsStore: store,
    loadWallets: services.load,
    getSelectedWallet: () => store.getState().getSelectedWallet(),
    checkKeychainIntegrity: services.integrity,
  };
});

const renderer = await vi.importActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
const initialState = useWalletsStore.getState();
let route: InitialRoute | null;
beforeEach(() => {
  vi.clearAllMocks();
  useWalletsStore.setState(initialState, true);
});
function Consumer(): null {
  route = useApplicationSetup();
  return null;
}

afterEach(() => {
  act(() => renderer.unmountComponentAtNode(312));
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('admits inventory and migrations before navigation, then follows selection without rerunning startup', async () => {
  vi.useFakeTimers();
  const load = Promise.withResolvers<void>();
  const migrate = Promise.withResolvers<void>();
  services.load.mockReturnValue(load.promise);
  services.migrate.mockReturnValue(migrate.promise);
  const idle = vi.fn();
  vi.stubGlobal('requestIdleCallback', idle);

  act(() => renderer.render(<Consumer />, 312, undefined, undefined));
  expect(route).toBeNull();
  expect(services.migrate).not.toHaveBeenCalled();

  await act(async () => {
    useWalletsStore.setState({ selectedWalletId: 'wallet', accountAddress: '0x0000000000000000000000000000000000000001' });
    load.resolve();
  });
  expect(route).toBeNull();
  expect(services.migrate).toHaveBeenCalledOnce();

  await act(async () => migrate.resolve());
  expect(route).toBe(Routes.SWIPE_LAYOUT);
  expect(idle).toHaveBeenCalledOnce();
  expect(services.context).toHaveBeenLastCalledWith({ walletType: 'owned', walletAddressHash: 'wallet-hash' });

  const wallet = useWalletsStore.getState().wallets.wallet;
  const updates = services.context.mock.calls.length;
  act(() => useWalletsStore.setState({ wallets: { wallet: { ...wallet, name: 'Renamed' } } }));
  expect(services.context).toHaveBeenCalledTimes(updates);

  act(() => useWalletsStore.setState({ accountAddress: '0x0000000000000000000000000000000000000002' }));
  expect(services.context).toHaveBeenCalledTimes(updates + 1);
  expect(services.collapse).toHaveBeenLastCalledWith('smallBalances', false);
  expect(services.load).toHaveBeenCalledOnce();
  expect(services.migrate).toHaveBeenCalledOnce();
});

it('chooses onboarding after empty-inventory startup and leaves navigation to the creation flow afterward', async () => {
  services.load.mockResolvedValue(undefined);
  services.migrate.mockResolvedValue(undefined);
  vi.stubGlobal('requestIdleCallback', vi.fn());

  await act(async () => renderer.render(<Consumer />, 312, undefined, undefined));
  expect(route).toBe(Routes.WELCOME_SCREEN);
  expect(services.load).toHaveBeenCalledOnce();
  expect(services.migrate).toHaveBeenCalledOnce();

  act(() => useWalletsStore.setState({ selectedWalletId: 'wallet', accountAddress: '0x0000000000000000000000000000000000000001' }));
  expect(services.context).toHaveBeenLastCalledWith({ walletType: 'owned', walletAddressHash: 'wallet-hash' });
  expect(route).toBe(Routes.WELCOME_SCREEN);
  expect(services.load).toHaveBeenCalledOnce();
});
