import { type createBaseStore } from '@storesjs/stores';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type SolanaBalances } from '@/features/solana/core/balances';
import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { useAccountMetadataStore } from '@/features/wallet/data/stores/accountMetadataStore';
import { EncryptionType, type RainbowWallet } from '@/features/wallet/types';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { fetchSolanaBalances } from './fetchSolanaBalances';
import { refreshSolanaBalances, useSolanaBalancesAddress, useSolanaBalancesStore, useSolanaWalletBalances } from './solanaBalancesStore';

const controls = vi.hoisted(() => ({ storeInstall: false }));
vi.mock('@/env', () => ({
  IS_DEV: false,
  IS_TEST: true,
  IS_PROD: false,
  get IS_STORE_INSTALL() {
    return controls.storeInstall;
  },
}));
vi.mock('@/features/solana/hooks/useIsSolanaEnabled', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useIsSolanaEnabled: createBaseStore(() => true) };
});
vi.mock('@/state/wallets/walletsStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useWalletsStore: createBaseStore(() => ({ wallets: {}, selected: null, walletReady: false, accountAddress: '' })) };
});
vi.mock('./fetchSolanaBalances', () => ({ fetchSolanaBalances: vi.fn() }));

const evm = '0x0000000000000000000000000000000000000001';
const address = 'EXzw16qKGtrWTaTd5gGG29FWSUDrTEDheh5ber156MNS';
const wallet: RainbowWallet = {
  id: 'balances-test',
  type: EthereumWalletType.mnemonic,
  name: 'Test',
  color: 0,
  imported: true,
  primary: true,
  encryptionType: EncryptionType.keychain,
  addresses: [{ address: evm, index: 0, label: 'Test', avatar: null, color: 0, visible: true }],
};
const flags = useIsSolanaEnabled as unknown as ReturnType<typeof createBaseStore<boolean>>;
const data: SolanaBalances = { address, currency: 'USD', total: '1.25', balances: [] };
let unsubscribe: () => void;

beforeEach(() => {
  controls.storeInstall = false;
  flags.setState(true, true);
  userAssetsStoreManager.setState({ currency: 'USD' });
  useWalletsStore.setState({ wallets: { [wallet.id]: structuredClone(wallet) }, selected: wallet, walletReady: true, accountAddress: evm });
  useAccountMetadataStore.setState({
    accounts: {
      '["balances-test",0]': {
        walletId: wallet.id,
        index: 0,
        sourceEvmAddress: evm,
        namespace: 'solana',
        address,
        version: 1,
      },
    },
  });
  vi.mocked(fetchSolanaBalances).mockReset().mockResolvedValue(data);
  unsubscribe = useSolanaWalletBalances.subscribe(() => undefined);
});
afterEach(() => {
  unsubscribe();
});

describe('isolated Solana balances lifecycle', () => {
  it('fetches the enabled address, keeps failed refresh data, and does not turn failure into zero', async () => {
    await refreshSolanaBalances();
    expect(fetchSolanaBalances).toHaveBeenCalledWith(address, 'USD', expect.any(AbortController));
    expect(useSolanaWalletBalances.getState().data?.total).toBe('1.25');
    vi.mocked(fetchSolanaBalances).mockRejectedValue(new Error('upstream failed'));
    await refreshSolanaBalances();
    expect(useSolanaWalletBalances.getState().data?.total).toBe('1.25');
    expect(useSolanaWalletBalances.getState().message).toContain('unavailable');
  });
  it('ignores an in-flight response after the selected account changes', async () => {
    let complete: (value: SolanaBalances) => void = () => undefined;
    vi.mocked(fetchSolanaBalances).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          complete = resolve;
        })
    );
    const request = refreshSolanaBalances();
    await vi.waitFor(() => expect(fetchSolanaBalances).toHaveBeenCalled());
    useWalletsStore.setState({ accountAddress: '0x0000000000000000000000000000000000000002' });
    complete(data);
    await request;
    expect(useSolanaWalletBalances.getState().data).toBeNull();
  });
  it('hides old results immediately on account or currency changes', async () => {
    await refreshSolanaBalances();
    useWalletsStore.setState({ accountAddress: '0x0000000000000000000000000000000000000002' });
    expect(useSolanaBalancesAddress.getState()).toBeNull();
    expect(useSolanaWalletBalances.getState().data).toBeNull();
    useWalletsStore.setState({ accountAddress: evm });
    userAssetsStoreManager.setState({ currency: 'EUR' });
    expect(useSolanaWalletBalances.getState().data).toBeNull();
  });
  it('makes no requests while flag-off, even through manual fetch, and clears visible holdings', async () => {
    await refreshSolanaBalances();
    flags.setState(false, true);
    vi.mocked(fetchSolanaBalances).mockClear();
    await refreshSolanaBalances();
    await useSolanaBalancesStore.getState().fetch({ address, currency: 'USD' }, { force: true });
    expect(fetchSolanaBalances).not.toHaveBeenCalled();
    expect(useSolanaWalletBalances.getState().data).toBeNull();
    expect(useSolanaWalletBalances.getState().message).toBeNull();
  });
  it('disables store installs, removed mappings, and damaged wallets', async () => {
    controls.storeInstall = true;
    useWalletsStore.setState({ wallets: { [wallet.id]: { ...wallet } } });
    expect(useSolanaBalancesAddress.getState()).toBeNull();
    controls.storeInstall = false;
    useWalletsStore.setState({ wallets: { [wallet.id]: { ...wallet, damaged: true } } });
    expect(useSolanaBalancesAddress.getState()).toBeNull();
    useWalletsStore.setState({ wallets: { [wallet.id]: { ...wallet } } });
    useAccountMetadataStore.setState({ accounts: {} });
    expect(useSolanaBalancesAddress.getState()).toBeNull();
  });
});
