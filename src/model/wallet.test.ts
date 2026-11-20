import { Wallet } from '@ethersproject/wallet';
import { hdkey } from 'ethereumjs-wallet';
import { beforeEach, expect, test, vi } from 'vitest';

import { DEFAULT_HD_PATH, WalletLibraryType } from '@/features/wallet/core/walletLibrary';
import { hasPreviousTransactions } from '@/features/wallet/data/hasPreviousTransactions';
import { getAllWallets, saveAllWallets, saveKeyForWallet } from '@/features/wallet/data/walletKeychain';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { deriveAccountFromBluetoothHardwareWallet } from '@/utils/wallet';

import { createWallet } from './wallet';

vi.mock('@/analytics', () => ({ analytics: { track: vi.fn(), event: {} } }));
vi.mock('@/features/hardware-wallet/state/hardwareWalletTxState', () => ({}));
vi.mock('@/features/local-auth/keychain', () => ({ maybeAuthenticateWithPINAndCreateIfNeeded: vi.fn() }));
vi.mock('@/features/local-auth/legacyKeychain', () => ({}));
vi.mock('@/features/wallet/data/hasPreviousTransactions', () => ({ hasPreviousTransactions: vi.fn() }));
vi.mock('@/features/wallet/data/initializeWalletProfilePreference', () => ({ initializeWalletProfilePreference: vi.fn() }));
vi.mock('@/features/wallet/data/loadWallet', () => ({}));
vi.mock('@/features/wallet/data/walletKeychain', () => ({
  getAllWallets: vi.fn(),
  saveAddress: vi.fn(),
  saveAllWallets: vi.fn(),
  saveKeyForWallet: vi.fn(),
  saveSeedPhrase: vi.fn(),
  setSelectedWallet: vi.fn(),
}));
vi.mock('@/handlers/web3', () => ({ addHexPrefix: (value: string) => `0x${value}` }));
vi.mock('@/helpers/alert', () => ({}));
vi.mock('@/helpers/signingWallet', () => ({ createSignature: vi.fn() }));
vi.mock('@/languages', () => ({}));
vi.mock('@/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
  RainbowError: class RainbowError extends Error {},
  ensureError: (error: unknown) => error,
}));
vi.mock('@/notifications/settings/initialization', () => ({ initializeNotificationSettingsForAddresses: vi.fn() }));
vi.mock('@/state/wallets/walletsStore', () => ({ setWalletDamaged: vi.fn() }));
vi.mock('@/utils/profileUtils', () => ({ addressHashedColorIndex: () => 0 }));
vi.mock('@/utils/signingUtils', () => ({}));
vi.mock('@/utils/wallet', () => ({ deriveAccountFromBluetoothHardwareWallet: vi.fn() }));

const root = hdkey.fromMasterSeed(Buffer.alloc(32, 1)).derivePath(DEFAULT_HD_PATH);
const accounts = Array.from({ length: 10 }, (_, index) => new Wallet(root.deriveChild(index).getWallet().getPrivateKey()));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAllWallets).mockResolvedValue({ version: 1, wallets: {} });
  vi.mocked(deriveAccountFromBluetoothHardwareWallet).mockImplementation(async (deviceId, index = 0) => ({
    address: accounts[index].address,
    hdnode: null,
    isHDWallet: false,
    root: null,
    type: EthereumWalletType.bluetooth,
    wallet: { address: accounts[index].address, privateKey: `${deviceId}/${index}` },
    walletType: WalletLibraryType.ledger,
  }));
});

test.each([EthereumWalletType.bluetooth, EthereumWalletType.mnemonic])(
  '%s discovery crosses isolated empty accounts and stops after two consecutive empty accounts',
  async type => {
    const fundedIndices = [1, 2, 3, 5, 7];
    vi.mocked(hasPreviousTransactions).mockImplementation(async address =>
      fundedIndices.some(index => accounts[index].address === address)
    );
    const isHardwareWallet = type === EthereumWalletType.bluetooth;

    await expect(
      createWallet({
        seed: 'test-wallet',
        checkedWallet: {
          address: accounts[0].address,
          hdnode: null,
          isHDWallet: !isHardwareWallet,
          root: isHardwareWallet ? null : root,
          type,
          wallet: isHardwareWallet ? { address: accounts[0].address, privateKey: 'test-wallet/0' } : root.deriveChild(0).getWallet(),
          walletType: isHardwareWallet ? WalletLibraryType.ledger : WalletLibraryType.bip39,
        },
      })
    ).resolves.not.toBeNull();

    expect(hasPreviousTransactions).toHaveBeenCalledTimes(9);
    expect(vi.mocked(hasPreviousTransactions).mock.calls.map(([address]) => address)).toEqual(
      accounts.slice(1).map(account => account.address)
    );
    expect(saveAllWallets).toHaveBeenCalledTimes(1);
    const savedWallet = Object.values(vi.mocked(saveAllWallets).mock.calls[0][0])[0];
    expect(savedWallet.addresses.map(account => account.index)).toEqual([0, ...fundedIndices]);
    expect(savedWallet.addresses.map(account => account.address)).toEqual([0, ...fundedIndices].map(index => accounts[index].address));
    expect(vi.mocked(saveKeyForWallet).mock.calls.map(([address]) => address)).toEqual(
      savedWallet.addresses.map(account => account.address)
    );
  }
);
