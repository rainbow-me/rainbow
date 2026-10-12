import { NativeModules, Platform } from 'react-native';

import { Wallet } from '@ethersproject/wallet';
import { mnemonicToSeedSync } from 'bip39';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deriveAccountFromMnemonic, mnemonicToSeedBytes } from './wallet';

vi.mock('react-native', () => ({
  NativeModules: { RNBip39: { mnemonicToSeed: vi.fn() } },
  Platform: { OS: 'ios' },
}));
vi.mock('@/features/hardware-wallet/utils/ledger', () => ({ getEthApp: vi.fn() }));
vi.mock('@/features/wallet/core/walletDerivation', () => ({ identifyWalletType: vi.fn() }));
vi.mock('@/handlers/web3', async () => {
  const { getAddress } = await import('@ethersproject/address');
  return { ensureChecksumAddress: getAddress, addHexPrefix: (value: string) => `0x${value}` };
});

const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

beforeEach(() => {
  vi.clearAllMocks();
});

describe.each(['ios', 'android'] as const)('mnemonic seed conversion on %s', platform => {
  beforeEach(() => {
    Platform.OS = platform;
    vi.mocked(NativeModules.RNBip39.mnemonicToSeed).mockResolvedValue(mnemonicToSeedSync(MNEMONIC).toString('base64'));
  });

  it('returns the BIP39 seed bytes using the existing platform implementation', async () => {
    await expect(mnemonicToSeedBytes(MNEMONIC)).resolves.toEqual(mnemonicToSeedSync(MNEMONIC));
    expect(vi.mocked(NativeModules.RNBip39.mnemonicToSeed).mock.calls).toEqual(
      platform === 'android' ? [[{ mnemonic: MNEMONIC, passphrase: null }]] : []
    );
  });

  it('preserves Ethereum derivation for a nonzero account index', async () => {
    const account = await deriveAccountFromMnemonic(MNEMONIC, 1);
    expect(account.address).toBe(Wallet.fromMnemonic(MNEMONIC, "m/44'/60'/0'/0/1").address);
  });
});
