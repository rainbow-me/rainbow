import { getAddress } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEnsNameStore } from '@/features/ens/data/useEnsNameStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { WalletLibraryType } from '@/features/wallet/core/walletLibrary';
import { EncryptionType, type RainbowWallet } from '@/features/wallet/types';
import { EthereumWalletType } from '@/helpers/walletTypes';

import { useAccountProfileInfo, useWalletsStore } from './walletsStore';

const services = vi.hoisted(() => ({
  reverse: vi.fn(),
  avatar: vi.fn(),
  wallets: vi.fn(),
  selected: vi.fn(),
  address: vi.fn(),
  damaged: vi.fn(),
  saveSeed: vi.fn(),
  discover: vi.fn(),
  history: vi.fn(),
}));

vi.mock('@/features/ens/data/ens', () => ({ resolveEnsName: services.reverse }));
vi.mock('@/features/ens/data/stores/imageStore', () => ({ useEnsImageStore: { getState: () => ({ load: services.avatar }) } }));
vi.mock('@/utils/profileUtils', () => ({
  addressHashedColorIndex: () => 0,
  addressHashedEmoji: () => '🌈',
  isValidImagePath: () => true,
}));
vi.mock('@/features/wallet/data/walletKeychain', () => ({
  saveSeedPhrase: services.saveSeed,
  saveKeyForWallet: vi.fn(),
  checkWalletsDamagedState: services.damaged,
  getAllWallets: services.wallets,
  getSelectedWallet: services.selected,
  loadAddress: services.address,
  cleanUpWalletKeys: vi.fn(),
  resetSelectedWallet: vi.fn(),
  saveAddress: vi.fn(),
  saveAllWallets: vi.fn(),
  setSelectedWallet: vi.fn(),
}));
vi.mock('@/handlers/localstorage/removeWallet', () => ({ removeWalletData: vi.fn() }));
vi.mock('@/features/wallet/utils/watchingAlert', () => ({ watchingAlert: vi.fn() }));
vi.mock('@/features/local-auth/keychain', () => ({
  has: vi.fn(),
  set: vi.fn(),
  publicAccessControlOptions: {},
  maybeAuthenticateWithPINAndCreateIfNeeded: vi.fn(),
}));
vi.mock('@/features/hardware-wallet/state/hardwareWalletTxState', () => ({ setHardwareWalletTxError: vi.fn() }));
vi.mock('@/features/wallet/data/loadWallet', () => ({ loadWallet: vi.fn() }));
vi.mock('@/features/wallet/data/initializeWalletProfilePreference', () => ({ initializeWalletProfilePreference: vi.fn() }));
vi.mock('@/helpers/alert', () => ({ WrappedAlert: { alert: vi.fn() } }));
vi.mock('@/helpers/signingWallet', () => ({ createSignature: vi.fn() }));
vi.mock('@/utils/wallet', () => ({
  deriveAccountFromWalletInput: vi.fn(),
  deriveAccountFromMnemonic: vi.fn(),
  deriveAccountFromBluetoothHardwareWallet: services.discover,
}));
vi.mock('@/utils/signingUtils', () => ({ sanitizeTypedData: vi.fn() }));
vi.mock('@/notifications/settings/initialization', () => ({ initializeNotificationSettingsForAddresses: vi.fn() }));
vi.mock('@/features/wallet/data/hasPreviousTransactions', () => ({ hasPreviousTransactions: services.history }));
vi.mock('@/navigation/Navigation', () => ({ default: { handleAction: vi.fn() } }));
vi.mock('@/theme/ThemeContext', () => ({ useTheme: vi.fn() }));
vi.mock('@/theme/themeStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useThemeStore: createBaseStore(() => ({ isDarkMode: false })) };
});
vi.mock('@/handlers/web3', () => ({ ensureValidHex: (value: string) => value, isValidHex: (value: string) => value?.startsWith('0x') }));

const ADDRESS = '0x000000000000000000000000000000000000000A';
const OTHER = '0x000000000000000000000000000000000000000b';
let wallet: RainbowWallet;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  useEnsNameStore.setState({ queryCache: {} });
  services.saveSeed.mockResolvedValue(undefined);
  wallet = {
    id: 'wallet',
    name: 'Wallet',
    color: 0,
    imported: false,
    primary: true,
    encryptionType: EncryptionType.keychain,
    type: EthereumWalletType.mnemonic,
    addresses: [
      { address: ADDRESS, index: 0, avatar: null, color: 0, label: 'Main', visible: true, emoji: '🌈', ens: 'main.eth', image: 'avatar' },
      {
        address: OTHER,
        index: 1,
        avatar: null,
        color: 1,
        label: 'Other',
        visible: true,
        emoji: '🌈',
        ens: 'other.eth',
        image: 'other-avatar',
      },
    ],
  };
  useWalletsStore.setState({
    wallets: { wallet },
    selectedWalletId: wallet.id,
    accountAddress: ADDRESS,
    walletNames: { [ADDRESS]: 'main.eth', [OTHER]: 'other.eth' },
  });
  services.reverse.mockResolvedValue('main.eth');
  services.avatar.mockResolvedValue('avatar');
  services.wallets.mockResolvedValue({ wallets: { wallet } });
  services.selected.mockResolvedValue({ wallet });
  services.address.mockResolvedValue(ADDRESS);
  services.damaged.mockResolvedValue(new Map([['wallet', false]]));
});

describe('wallet state transitions', () => {
  it('observes published ENS names while preserving custom account labels', () => {
    const stop = useAccountProfileInfo.subscribe(() => undefined);
    publishName('updated.eth');
    expect(useAccountProfileInfo.getState()).toMatchObject({ accountENS: 'updated.eth', accountName: 'Main' });

    useWalletsStore.setState({
      wallets: { wallet: { ...wallet, addresses: [{ ...wallet.addresses[0], label: 'main.eth' }, wallet.addresses[1]] } },
    });
    expect(useAccountProfileInfo.getState().accountName).toBe('updated.eth');

    publishName(null);
    expect(useAccountProfileInfo.getState()).toMatchObject({ accountENS: undefined, accountName: '' });
    stop();

    function publishName(name: string | null): void {
      const address = ADDRESS.toLowerCase();
      useEnsNameStore.setState({
        queryCache: {
          [`:${address}`]: { data: { [address]: name }, lastFetchedAt: Date.now(), cacheTime: Infinity, errorInfo: null },
        },
      });
    }
  });

  it('preserves the whole state for an unchanged metadata refresh and matches addresses case-insensitively', async () => {
    const before = useWalletsStore.getState();
    const listener = vi.fn();
    const stop = useWalletsStore.subscribe(listener);
    await before.refreshWalletInfo({ addresses: [ADDRESS.toLowerCase()] });
    expect(services.reverse).toHaveBeenCalledWith(getAddress(ADDRESS), ChainId.mainnet, expect.any(AbortSignal));
    expect(useWalletsStore.getState()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
    stop();
  });

  it('updates selected metadata while retaining untouched accounts and wallets', async () => {
    const untouched = { ...wallet, id: 'untouched', addresses: [wallet.addresses[1]] };
    useWalletsStore.setState({ wallets: { wallet, untouched } });
    services.reverse.mockResolvedValue('new.eth');
    services.avatar.mockResolvedValue('new-avatar');
    await useWalletsStore.getState().refreshWalletInfo({ addresses: [ADDRESS] });
    const state = useWalletsStore.getState();
    expect(state.getSelectedWallet()).toBe(state.wallets.wallet);
    expect(state.getSelectedWallet()?.addresses[0].ens).toBe('new.eth');
    expect(state.wallets.wallet.addresses[1]).toBe(wallet.addresses[1]);
    expect(state.wallets.untouched).toBe(untouched);
  });
});

describe('independent optional-metadata boundaries', () => {
  it('does not publish an unchanged account when optional ENS/image fields were absent', async () => {
    const account = { address: ADDRESS, index: 0, avatar: null, color: 0, label: 'Main', visible: true, emoji: '🌈' };
    const minimalWallet = { ...wallet, addresses: [account] };
    useWalletsStore.setState({ wallets: { wallet: minimalWallet }, selectedWalletId: minimalWallet.id, walletNames: {} });
    services.reverse.mockResolvedValue(null);
    const before = useWalletsStore.getState();
    await before.refreshWalletInfo({ addresses: [ADDRESS] });
    expect(useWalletsStore.getState()).toBe(before);
  });
});

describe('canonical selection', () => {
  it('retains root and selected identity when selecting the same pair', async () => {
    const before = useWalletsStore.getState();
    await before.setSelectedWallet(wallet.id, ADDRESS);
    expect(useWalletsStore.getState()).toBe(before);
    expect(before.getSelectedWallet()).toBe(wallet);
  });

  it('changes accounts without replacing the selected record', async () => {
    await useWalletsStore.getState().setSelectedWallet(wallet.id, OTHER);
    expect(useWalletsStore.getState().accountAddress).toBe(OTHER);
    expect(useWalletsStore.getState().getSelectedWallet()).toBe(wallet);
  });

  it('does not replace selection when removing the same address in another group', async () => {
    const other = { ...wallet, id: 'other', addresses: [wallet.addresses[0]] };
    useWalletsStore.setState({ wallets: { wallet, other } });
    await useWalletsStore.getState().removeAccount('other', ADDRESS);
    expect(useWalletsStore.getState().getSelectedWallet()).toBe(wallet);
    expect(useWalletsStore.getState().accountAddress).toBe(ADDRESS);
    expect(useWalletsStore.getState().wallets.other).toBeUndefined();
  });

  it('publishes inventory and replacement selection together', async () => {
    const seen: string[] = [];
    const stop = useWalletsStore.subscribe(state => {
      const selected = state.getSelectedWallet();
      expect(selected?.addresses.some(account => account.visible && account.address === state.accountAddress)).toBe(true);
      seen.push(state.accountAddress);
    });
    await useWalletsStore.getState().removeAccount('wallet', ADDRESS);
    stop();
    expect(seen).toEqual([OTHER]);
    expect(useWalletsStore.getState().wallets.wallet.addresses[0].visible).toBe(false);
  });

  it('clears the final selected account using the empty state', async () => {
    await useWalletsStore.getState().removeAccount('wallet', OTHER);
    await useWalletsStore.getState().removeAccount('wallet', ADDRESS);
    expect(useWalletsStore.getState().selectedWalletId).toBeNull();
    expect(useWalletsStore.getState().accountAddress).toBe('');
    expect(useWalletsStore.getState().wallets).toEqual({});
  });

  it('repairs a saved address within its selected group before publishing', async () => {
    services.address.mockResolvedValue('0x000000000000000000000000000000000000000c');
    await useWalletsStore.getState().loadWallets();
    expect(useWalletsStore.getState().accountAddress).toBe(ADDRESS);
    expect(useWalletsStore.getState().getSelectedWallet()).toBe(wallet);
  });

  it('chooses a visible saved address in another group when the saved group is gone', async () => {
    services.selected.mockResolvedValue({ wallet: { ...wallet, id: 'gone' } });
    services.address.mockResolvedValue(OTHER);
    await useWalletsStore.getState().loadWallets();
    expect(useWalletsStore.getState().selectedWalletId).toBe('wallet');
    expect(useWalletsStore.getState().accountAddress).toBe(OTHER);
  });

  it('converts the persisted snapshot without repairing the selection in the schema migration', () => {
    const migrate = useWalletsStore.persist.getOptions().migrate;
    expect(migrate?.({ selected: wallet, accountAddress: OTHER, wallets: {} }, 1)).toEqual({
      selectedWalletId: 'wallet',
      accountAddress: OTHER,
      wallets: {},
      walletNames: undefined,
    });
  });
});

describe('switching and inventory admission', () => {
  it('switches from live inventory without reading saved inventory or selection', async () => {
    const { switchWallet } = await import('./switchWallet');
    expect(await switchWallet(OTHER)).toBe(OTHER);
    expect(useWalletsStore.getState().accountAddress).toBe(OTHER);
    expect(useWalletsStore.getState().getSelectedWallet()).toBe(wallet);
    expect(services.wallets).not.toHaveBeenCalled();
    expect(services.address).not.toHaveBeenCalled();
    expect(services.selected).not.toHaveBeenCalled();
  });

  it('retains the selected group for address-only switches and honors an explicit different group', async () => {
    const { switchWallet } = await import('./switchWallet');
    const other = { ...wallet, id: 'other' };
    useWalletsStore.setState({ wallets: { other, wallet } });
    await switchWallet('0x000000000000000000000000000000000000000a');
    expect(useWalletsStore.getState().selectedWalletId).toBe('wallet');
    await switchWallet(ADDRESS, 'other');
    expect(useWalletsStore.getState().getSelectedWallet()).toBe(other);
  });

  it('does not select hidden accounts or substitute another group for a missing explicit group', async () => {
    const { switchWallet } = await import('./switchWallet');
    useWalletsStore.setState({ wallets: { wallet: { ...wallet, addresses: [{ ...wallet.addresses[0], visible: false }] } } });
    const before = useWalletsStore.getState();
    expect(await switchWallet(ADDRESS)).toBeNull();
    expect(await switchWallet(ADDRESS, 'missing')).toBeNull();
    expect(useWalletsStore.getState()).toBe(before);
  });

  it('admits new inventory and its selected account in one publication', async () => {
    const created = { ...wallet, id: 'created', addresses: [wallet.addresses[1]] };
    const seen: string[] = [];
    const stop = useWalletsStore.subscribe(state => {
      expect(state.getSelectedWallet()?.addresses.some(account => account.visible && account.address === state.accountAddress)).toBe(true);
      seen.push(state.selectedWalletId ?? '');
    });
    await useWalletsStore.getState().addWallet(created, OTHER);
    stop();
    expect(seen).toEqual(['created']);
  });

  it('retains the current pair and record when admitting a silent import', async () => {
    const imported = { ...wallet, id: 'imported', addresses: [wallet.addresses[1]] };
    await useWalletsStore.getState().addWallet(imported);
    expect(useWalletsStore.getState().getSelectedWallet()).toBe(wallet);
    expect(useWalletsStore.getState().accountAddress).toBe(ADDRESS);
  });
});

it('publishes creation against the live inventory after key storage completes', async () => {
  const { createWallet } = await import('@/model/wallet');
  const savingKeys = Promise.withResolvers<void>();
  services.saveSeed.mockReturnValue(savingKeys.promise);
  const address = '0x000000000000000000000000000000000000000c';
  const creation = createWallet({
    seed: address,
    checkedWallet: {
      address,
      hdnode: null,
      isHDWallet: false,
      root: null,
      type: EthereumWalletType.readOnly,
      wallet: { address, privateKey: null },
      walletType: WalletLibraryType.ethers,
    },
  });

  services.reverse.mockResolvedValue('updated.eth');
  services.avatar.mockResolvedValue('updated-avatar');
  await useWalletsStore.getState().refreshWalletInfo({ addresses: [ADDRESS] });
  const updatedWallet = useWalletsStore.getState().wallets.wallet;
  expect(updatedWallet.addresses[0].ens).toBe('updated.eth');

  savingKeys.resolve();
  const created = await creation;
  expect(created).not.toBeNull();
  expect(useWalletsStore.getState().wallets.wallet).toBe(updatedWallet);
  expect(useWalletsStore.getState().getSelectedWallet()).toBe(created);
  expect(useWalletsStore.getState().accountAddress).toBe(address);
  expect(services.wallets).not.toHaveBeenCalled();
});

it('repairs keys without replacing existing backup metadata or known accounts, and enriches discovered accounts', async () => {
  const existing = { ...wallet, damaged: true, backedUp: true, backupDate: 123, name: 'Personal wallet' };
  useWalletsStore.setState({ wallets: { wallet: existing } });
  const discovered = { ...wallet.addresses[1], address: '0x000000000000000000000000000000000000000c', ens: undefined };
  const incoming = { ...wallet, name: 'Default import name', backedUp: false, addresses: [wallet.addresses[0], discovered] };

  await useWalletsStore.getState().addWallet(incoming, ADDRESS);
  const repaired = useWalletsStore.getState().getSelectedWallet();
  expect(repaired?.name).toBe('Personal wallet');
  expect(repaired?.backedUp).toBe(true);
  expect(repaired?.backupDate).toBe(123);
  expect(repaired?.damaged).toBe(false);
  expect(repaired?.addresses.slice(0, 2)).toEqual(existing.addresses);
  expect(repaired?.addresses[0]).toBe(existing.addresses[0]);
  expect(repaired?.addresses[1]).toBe(existing.addresses[1]);
  expect(repaired?.addresses[2].address).toBe(discovered.address);
  expect(services.reverse).toHaveBeenCalledWith(getAddress(discovered.address), ChainId.mainnet, expect.any(AbortSignal));
});

it('keeps a known account that discovery examined but did not admit', async () => {
  const { createWallet } = await import('@/model/wallet');
  const address = '0x000000000000000000000000000000000000000c';
  services.discover.mockResolvedValue({ wallet: { address: OTHER, privateKey: null } });
  services.history.mockResolvedValue(false);
  const created = await createWallet({
    seed: 'hardware-device',
    checkedWallet: {
      address,
      hdnode: null,
      isHDWallet: false,
      root: null,
      type: EthereumWalletType.bluetooth,
      wallet: { address, privateKey: null },
      walletType: WalletLibraryType.ledger,
    },
  });

  expect(services.discover).toHaveBeenCalledTimes(2);
  expect(created?.addresses.map(account => account.address)).toEqual([address]);
  expect(useWalletsStore.getState().wallets.wallet).toBe(wallet);
});
