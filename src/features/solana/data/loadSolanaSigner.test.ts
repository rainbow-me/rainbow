import { createHash } from 'crypto';

import { EthereumWalletType } from '@/helpers/walletTypes';
import { getSeedPhrase, identifyWalletType } from '@/model/wallet';
import { mnemonicToSeedBytes } from '@/utils/wallet';

import { deriveSolanaAddress } from '../derivation';
import { loadSolanaSigner } from './loadSolanaSigner';

jest.mock('@/model/wallet', () => ({
  getSeedPhrase: jest.fn(),
  identifyWalletType: jest.fn(),
}));

jest.mock('@/utils/wallet', () => ({
  mnemonicToSeedBytes: jest.fn(),
}));

const mockGetSeedPhrase = getSeedPhrase as jest.MockedFunction<typeof getSeedPhrase>;
const mockIdentifyWalletType = identifyWalletType as jest.MockedFunction<typeof identifyWalletType>;
const mockMnemonicToSeedBytes = mnemonicToSeedBytes as jest.MockedFunction<typeof mnemonicToSeedBytes>;

const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const SEED = new Uint8Array(createHash('sha512').update('loadSolanaSigner test seed', 'utf8').digest());

const seedPhraseData = (seedphrase: string) => ({ seedphrase, version: '1.0' });

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSeedPhrase.mockResolvedValue(seedPhraseData(MNEMONIC));
  mockIdentifyWalletType.mockReturnValue(EthereumWalletType.mnemonic);
  mockMnemonicToSeedBytes.mockResolvedValue(SEED);
});

describe('loadSolanaSigner', () => {
  it('derives the signer for the requested account index', async () => {
    const signer = await loadSolanaSigner({ walletId: 'wallet-1', accountIndex: 0 });

    expect(signer?.address).toBe(deriveSolanaAddress(SEED, 0));
    expect(mockGetSeedPhrase).toHaveBeenCalledWith('wallet-1', { androidEncryptionPin: undefined });
    expect(mockMnemonicToSeedBytes).toHaveBeenCalledWith(MNEMONIC);
  });

  it('forwards the Android encryption pin to the keychain read', async () => {
    // Both of `getSeedPhrase`'s existing callers pass this. On an Android device that has
    // one set, omitting it makes the read fail, which this function would report as a
    // wallet with no Solana account.
    await loadSolanaSigner({ walletId: 'wallet-1', accountIndex: 0, androidEncryptionPin: '1234' });
    expect(mockGetSeedPhrase).toHaveBeenCalledWith('wallet-1', { androidEncryptionPin: '1234' });
  });

  it('derives a different account for a different index', async () => {
    const first = await loadSolanaSigner({ walletId: 'wallet-1', accountIndex: 0 });
    const second = await loadSolanaSigner({ walletId: 'wallet-1', accountIndex: 1 });

    expect(second?.address).toBe(deriveSolanaAddress(SEED, 1));
    expect(second?.address).not.toBe(first?.address);
  });

  it('reuses the shared seed step rather than restating the platform split', async () => {
    // The reason `mnemonicToSeedBytes` was extracted: iOS and Android reach the seed by
    // different routes and must agree byte for byte, so there must be exactly one copy of
    // that decision.
    await loadSolanaSigner({ walletId: 'wallet-1', accountIndex: 0 });
    expect(mockMnemonicToSeedBytes).toHaveBeenCalledTimes(1);
  });

  it('returns null when the keychain read is cancelled or empty, without throwing', async () => {
    // `getSeedPhrase` already turns a cancelled biometric prompt into null, and a
    // cancelled prompt is a choice rather than a fault.
    mockGetSeedPhrase.mockResolvedValue(null);
    await expect(loadSolanaSigner({ walletId: 'wallet-1', accountIndex: 0 })).resolves.toBeNull();
    expect(mockMnemonicToSeedBytes).not.toHaveBeenCalled();
  });

  it.each([
    ['a private-key wallet', EthereumWalletType.privateKey],
    ['a hardware wallet', EthereumWalletType.bluetooth],
    ['a read-only wallet', EthereumWalletType.readOnly],
  ])('returns null for %s, because there is no seed to derive from', async (_label, walletType) => {
    mockIdentifyWalletType.mockReturnValue(walletType);
    await expect(loadSolanaSigner({ walletId: 'wallet-1', accountIndex: 0 })).resolves.toBeNull();
    expect(mockMnemonicToSeedBytes).not.toHaveBeenCalled();
  });

  it('returns null rather than throwing when derivation fails', async () => {
    mockMnemonicToSeedBytes.mockRejectedValue(new Error('native module unavailable'));
    await expect(loadSolanaSigner({ walletId: 'wallet-1', accountIndex: 0 })).resolves.toBeNull();
  });

  it('returns null rather than throwing when the seed is an unusable length', async () => {
    mockMnemonicToSeedBytes.mockResolvedValue(new Uint8Array(8));
    await expect(loadSolanaSigner({ walletId: 'wallet-1', accountIndex: 0 })).resolves.toBeNull();
  });

  it('does not expose the seed or the private key on the returned signer', async () => {
    // The containment the key layer provides: the private key stays captured in the
    // closure. This asserts the surface, which is what a caller could accidentally log.
    const signer = await loadSolanaSigner({ walletId: 'wallet-1', accountIndex: 0 });

    expect(Object.keys(signer ?? {}).sort()).toEqual(['address', 'sign']);
    expect(JSON.stringify(signer)).not.toContain('seed');
  });
});
