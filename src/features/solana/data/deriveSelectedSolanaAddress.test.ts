import { mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { maybeAuthenticateWithPIN } from '@/features/local-auth/keychain';
import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { getSeedPhrase } from '@/features/wallet/data/walletKeychain';
import { EncryptionType, type RainbowWallet } from '@/features/wallet/types';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { getAccountAddress, getSelectedWallet } from '@/state/wallets/walletsStore';
import { mnemonicToSeedBytes } from '@/utils/wallet';

import { deriveSelectedSolanaAddress } from './deriveSelectedSolanaAddress';

vi.mock('@/features/local-auth/keychain', () => ({ maybeAuthenticateWithPIN: vi.fn() }));
vi.mock('@/features/solana/hooks/useIsSolanaEnabled', () => ({ useIsSolanaEnabled: { getState: vi.fn() } }));
vi.mock('@/features/wallet/data/walletKeychain', () => ({ getSeedPhrase: vi.fn() }));
vi.mock('@/features/wallet/core/walletDerivation', () => ({
  identifyWalletType: (phrase: string) => (validateMnemonic(phrase) ? EthereumWalletType.mnemonic : EthereumWalletType.seed),
}));
vi.mock('@/state/wallets/walletsStore', () => ({ getSelectedWallet: vi.fn(), getAccountAddress: vi.fn() }));
vi.mock('@/utils/wallet', () => ({ mnemonicToSeedBytes: vi.fn() }));

const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const SOURCE_ADDRESS = '0x0000000000000000000000000000000000000001';
const wallet: RainbowWallet = {
  id: 'wallet_test',
  name: 'Test wallet',
  type: EthereumWalletType.mnemonic,
  addresses: [{ address: SOURCE_ADDRESS, index: 0, label: 'First account', avatar: null, color: 0, visible: true }],
  color: 0,
  imported: true,
  primary: true,
  encryptionType: EncryptionType.keychain,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useIsSolanaEnabled.getState).mockReturnValue(true);
  vi.mocked(getSelectedWallet).mockReturnValue(wallet);
  vi.mocked(getAccountAddress).mockReturnValue(SOURCE_ADDRESS);
  vi.mocked(maybeAuthenticateWithPIN).mockResolvedValue(undefined);
  vi.mocked(getSeedPhrase).mockResolvedValue({ id: wallet.id, seedphrase: MNEMONIC, version: 1 });
  vi.mocked(mnemonicToSeedBytes).mockImplementation(async phrase => mnemonicToSeedSync(phrase));
});

describe('deriveSelectedSolanaAddress', () => {
  it('derives the selected account index from the existing seed and passes the Android PIN to keychain', async () => {
    vi.mocked(maybeAuthenticateWithPIN).mockResolvedValue('1234');

    await expect(deriveSelectedSolanaAddress()).resolves.toEqual({
      address: 'HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk',
      accountIndex: 0,
      derivationPath: "m/44'/501'/0'/0'",
      sourceAddress: SOURCE_ADDRESS,
    });
    expect(getSeedPhrase).toHaveBeenCalledWith(wallet.id, { androidEncryptionPin: '1234' });
  });

  it('does not authenticate or read secrets when Solana is disabled', async () => {
    vi.mocked(useIsSolanaEnabled.getState).mockReturnValue(false);
    await expect(deriveSelectedSolanaAddress()).resolves.toBeNull();
    expect(maybeAuthenticateWithPIN).not.toHaveBeenCalled();
    expect(getSeedPhrase).not.toHaveBeenCalled();
  });

  it.each([EthereumWalletType.privateKey, EthereumWalletType.readOnly, EthereumWalletType.bluetooth, EthereumWalletType.seed])(
    'rejects a %s wallet before accessing keychain',
    async type => {
      vi.mocked(getSelectedWallet).mockReturnValue({ ...wallet, type });
      await expect(deriveSelectedSolanaAddress()).rejects.toThrow('recovery phrase wallet');
      expect(maybeAuthenticateWithPIN).not.toHaveBeenCalled();
      expect(getSeedPhrase).not.toHaveBeenCalled();
    }
  );

  it('rejects a selected address missing from the wallet without falling back to index zero', async () => {
    vi.mocked(getSelectedWallet).mockReturnValue({ ...wallet, addresses: [] });
    await expect(deriveSelectedSolanaAddress()).rejects.toThrow('Select an account');
    expect(getSeedPhrase).not.toHaveBeenCalled();
  });

  it('rejects an invalid stored account index before authentication', async () => {
    vi.mocked(getSelectedWallet).mockReturnValue({ ...wallet, addresses: [{ ...wallet.addresses[0], index: -1 }] });
    await expect(deriveSelectedSolanaAddress()).rejects.toThrow('path index');
    expect(maybeAuthenticateWithPIN).not.toHaveBeenCalled();
  });

  it('stops quietly when PIN authentication is cancelled', async () => {
    vi.mocked(maybeAuthenticateWithPIN).mockRejectedValue(undefined);
    await expect(deriveSelectedSolanaAddress()).resolves.toBeNull();
    expect(getSeedPhrase).not.toHaveBeenCalled();
  });

  it('propagates an unexpected authentication failure', async () => {
    vi.mocked(maybeAuthenticateWithPIN).mockRejectedValue(new Error('Authentication unavailable'));
    await expect(deriveSelectedSolanaAddress()).rejects.toThrow('Authentication unavailable');
    expect(getSeedPhrase).not.toHaveBeenCalled();
  });

  it('does not derive after a cancelled or unavailable keychain read', async () => {
    vi.mocked(getSeedPhrase).mockResolvedValue(null);
    await expect(deriveSelectedSolanaAddress()).resolves.toBeNull();
    expect(mnemonicToSeedBytes).not.toHaveBeenCalled();
  });

  it('validates the recovered phrase before converting it to a seed', async () => {
    vi.mocked(getSeedPhrase).mockResolvedValue({ id: wallet.id, seedphrase: 'invalid mnemonic', version: 1 });
    await expect(deriveSelectedSolanaAddress()).rejects.toThrow('valid recovery phrase');
    expect(mnemonicToSeedBytes).not.toHaveBeenCalled();
  });

  it('stops before reading secrets if the selected wallet changes during authentication', async () => {
    vi.mocked(maybeAuthenticateWithPIN).mockImplementation(async () => {
      vi.mocked(getSelectedWallet).mockReturnValue({ ...wallet, id: 'another_wallet' });
      return undefined;
    });
    await expect(deriveSelectedSolanaAddress()).resolves.toBeNull();
    expect(getSeedPhrase).not.toHaveBeenCalled();
  });

  it('stops if the flag is disabled during the keychain read', async () => {
    vi.mocked(getSeedPhrase).mockImplementation(async () => {
      vi.mocked(useIsSolanaEnabled.getState).mockReturnValue(false);
      return { id: wallet.id, seedphrase: MNEMONIC, version: 1 };
    });
    await expect(deriveSelectedSolanaAddress()).resolves.toBeNull();
    expect(mnemonicToSeedBytes).not.toHaveBeenCalled();
  });

  it.each([false, true])('clears the temporary seed even if the selected account changes: %s', async changeAccount => {
    const seed = mnemonicToSeedSync(MNEMONIC);
    vi.mocked(mnemonicToSeedBytes).mockImplementation(async () => {
      if (changeAccount) vi.mocked(getAccountAddress).mockReturnValue('0x0000000000000000000000000000000000000002');
      return seed;
    });
    const result = await deriveSelectedSolanaAddress();
    expect(result === null).toBe(changeAccount);
    expect(seed.every(byte => byte === 0)).toBe(true);
  });
});
