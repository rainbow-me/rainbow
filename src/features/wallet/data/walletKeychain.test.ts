import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as kc from '@/features/local-auth/keychain';
import { addressKey, allWalletsKey } from '@/features/local-auth/keychainConstants';
import * as legacyKeychain from '@/features/local-auth/legacyKeychain';
import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { EncryptionType, type AccountPrivateKeyData, type AllRainbowWallets } from '@/features/wallet/types';
import { EthereumWalletType } from '@/helpers/walletTypes';

import {
  checkWalletsDamagedState,
  getAllWallets,
  getPrivateKey,
  loadAddress,
  migrateWalletSecrets,
  readWalletMnemonic,
  removeAccountKey,
  saveAllWallets,
  saveKeyForWallet,
  savePrivateKey,
} from './walletKeychain';

vi.mock('@/features/solana/hooks/useIsSolanaEnabled', () => ({ useIsSolanaEnabled: { getState: vi.fn(() => true) } }));

vi.mock('@/features/local-auth/keychain', () => ({
  ErrorType: {
    Unknown: 0,
    UserCanceled: -1,
    NotAuthenticated: -2,
    Unavailable: -3,
  },
  has: vi.fn(),
  getObject: vi.fn(),
  isPasscodeAuthAvailable: vi.fn(),
  maybeAuthenticateWithPIN: vi.fn().mockResolvedValue(undefined),
  publicAccessControlOptions: { accessible: 'public' },
  setObject: vi.fn(),
  getPrivateString: vi.fn(),
  setPrivateString: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/features/local-auth/legacyKeychain', () => ({
  loadString: vi.fn(),
  publicAccessControlOptions: { accessible: 'public' },
  saveString: vi.fn(),
  getPrivateAccessControlOptions: vi.fn().mockResolvedValue({ accessControl: 'private' }),
}));

vi.mock('@/navigation/Navigation', () => ({
  default: { handleAction: vi.fn() },
}));

vi.mock('@/navigation/routesNames', () => ({
  default: { WALLET_ERROR_SHEET: 'WalletErrorSheet' },
}));

vi.mock('@/utils/wallet', () => ({
  deriveAccountFromMnemonic: vi.fn(),
}));

const ADDRESS = '0x0000000000000000000000000000000000000001';
const WALLETS: AllRainbowWallets = {
  wallet_1: {
    addresses: [
      {
        address: ADDRESS,
        avatar: null,
        color: 0,
        index: 0,
        label: 'Main',
        visible: true,
      },
    ],
    color: 0,
    encryptionType: EncryptionType.keychain,
    id: 'wallet_1',
    imported: false,
    name: 'Wallet',
    primary: true,
    type: EthereumWalletType.mnemonic,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('walletKeychain', () => {
  it('stores the complete wallets record with its schema version', async () => {
    await saveAllWallets(WALLETS);

    expect(kc.setObject).toHaveBeenCalledWith(
      allWalletsKey,
      {
        version: 1,
        wallets: WALLETS,
      },
      kc.publicAccessControlOptions
    );
  });

  it('loads the complete wallets record', async () => {
    const storedWallets = { version: 1, wallets: WALLETS };
    vi.mocked(kc.getObject).mockResolvedValue({ value: storedWallets, error: undefined });

    await expect(getAllWallets()).resolves.toEqual(storedWallets);
  });

  it('returns only string account addresses from legacy storage', async () => {
    vi.mocked(legacyKeychain.loadString).mockResolvedValueOnce(ADDRESS).mockResolvedValueOnce(kc.ErrorType.UserCanceled);

    await expect(loadAddress()).resolves.toBe(ADDRESS);
    await expect(loadAddress()).resolves.toBeNull();
    expect(legacyKeychain.loadString).toHaveBeenCalledWith(addressKey);
  });

  it('preserves keychain cancellation when loading a private key', async () => {
    vi.mocked(kc.getObject).mockResolvedValue({ value: undefined, error: kc.ErrorType.UserCanceled });

    await expect(getPrivateKey(ADDRESS)).resolves.toBe(kc.ErrorType.UserCanceled);
  });

  it.each([kc.ErrorType.UserCanceled, kc.ErrorType.NotAuthenticated])(
    'does not complete legacy migration after keychain error %s',
    async error => {
      vi.mocked(legacyKeychain.loadString).mockResolvedValue(error);

      await expect(migrateWalletSecrets()).resolves.toBeNull();
      expect(legacyKeychain.saveString).not.toHaveBeenCalled();
    }
  );

  it('rejects a malformed hardware wallet key before writing it', async () => {
    await expect(saveKeyForWallet(ADDRESS, 'not-a-hardware-key', true)).rejects.toThrow('Invalid hardware wallet key');
    expect(kc.setObject).not.toHaveBeenCalled();
  });

  it('marks an iOS wallet as damaged when its keychain key cannot be checked', async () => {
    vi.mocked(kc.isPasscodeAuthAvailable).mockResolvedValue(true);
    vi.mocked(kc.has).mockRejectedValue(new Error('Keychain unavailable'));

    await expect(checkWalletsDamagedState(WALLETS)).resolves.toEqual(new Map([['wallet_1', true]]));
  });
});

describe('raw address keychain contract', () => {
  const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const record: AccountPrivateKeyData = {
    address: '4zvwRjXUKGfvwnParsHAS3HuSVzV5cA4McphgmoCtajS',
    privateKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    format: 'ed25519-seed-base64',
    version: 1,
  };
  const storageKey = `rainbow.account-key.v1/solana/${record.address}`;

  beforeEach(() => {
    vi.mocked(useIsSolanaEnabled.getState).mockReturnValue(true);
    vi.mocked(kc.getObject)
      .mockReset()
      .mockResolvedValue({ value: { version: 1, wallets: WALLETS }, error: undefined });
    vi.mocked(kc.getPrivateString).mockReset().mockResolvedValue({ status: 'missing-key' });
    vi.mocked(kc.setPrivateString).mockReset().mockResolvedValue({ status: 'ok', value: undefined });
    vi.mocked(kc.has).mockReset().mockResolvedValue(false);
    vi.mocked(kc.remove).mockReset().mockResolvedValue(undefined);
  });

  it('reads only validated mnemonic records through the private primitive', async () => {
    const data = { id: 'wallet_1', version: 1, seedphrase: mnemonic };
    vi.mocked(kc.getPrivateString).mockResolvedValue({ status: 'ok', value: JSON.stringify(data) });
    await expect(readWalletMnemonic('wallet_1', { androidEncryptionPin: '1234' })).resolves.toEqual({ status: 'ok', value: data });
    expect(kc.getPrivateString).toHaveBeenCalledWith(
      'wallet_1_rainbowSeedPhrase',
      expect.objectContaining({ androidEncryptionPin: '1234' })
    );
    expect(kc.setObject).not.toHaveBeenCalled();
  });

  it.each([
    '{',
    JSON.stringify({ id: 'other', version: 1, seedphrase: mnemonic }),
    JSON.stringify({ id: 'wallet_1', version: 1, seedphrase: ADDRESS }),
  ])('rejects malformed, misbound, or non-mnemonic source records %#', async value => {
    vi.mocked(kc.getPrivateString).mockResolvedValue({ status: 'ok', value });
    await expect(readWalletMnemonic('wallet_1')).resolves.toEqual({ status: 'invalid-record' });
  });

  it('reports legacy mnemonic migration without migrating or navigating', async () => {
    vi.mocked(kc.has).mockResolvedValue(true);
    await expect(readWalletMnemonic('wallet_1')).resolves.toEqual({ status: 'legacy-migration-required' });
    expect(legacyKeychain.loadString).not.toHaveBeenCalled();
    expect(kc.setObject).not.toHaveBeenCalled();
  });

  it.each([
    ['cancelled', kc.ErrorType.UserCanceled],
    ['not-authenticated', kc.ErrorType.NotAuthenticated],
    ['unavailable', null],
  ] as const)('preserves %s with the existing getter return convention and prevents writes', async (status, expected) => {
    vi.mocked(kc.getPrivateString).mockResolvedValue({ status });
    await expect(readWalletMnemonic('wallet_1')).resolves.toEqual({ status });
    await expect(getPrivateKey(record.address)).resolves.toBe(expected);
    await expect(savePrivateKey(record.address, record.privateKey)).rejects.toThrow(status);
    expect(kc.has).not.toHaveBeenCalled();
    expect(kc.setPrivateString).not.toHaveBeenCalled();
  });

  it('saves and retrieves a Solana key using only its raw address', async () => {
    await expect(savePrivateKey(record.address, record.privateKey, { androidEncryptionPin: '1234' })).resolves.toBeUndefined();
    expect(kc.setPrivateString).toHaveBeenCalledWith(
      storageKey,
      expect.any(String),
      expect.objectContaining({ androidEncryptionPin: '1234' })
    );
    expect(JSON.parse(vi.mocked(kc.setPrivateString).mock.calls[0][1])).toEqual(record);
    vi.mocked(kc.getPrivateString).mockResolvedValue({ status: 'ok', value: JSON.stringify(record) });
    await expect(getPrivateKey(record.address, { androidEncryptionPin: '1234' })).resolves.toEqual(record);
    expect(kc.getPrivateString).toHaveBeenLastCalledWith(storageKey, expect.objectContaining({ androidEncryptionPin: '1234' }));
    await expect(savePrivateKey(record.address, record.privateKey)).resolves.toBeUndefined();
    expect(kc.setPrivateString).toHaveBeenCalledTimes(1);
    expect(kc.getObject).not.toHaveBeenCalled();
    expect(kc.setObject).not.toHaveBeenCalled();
  });

  it('preserves the legacy EVM key name, JSON, and result when Solana is disabled', async () => {
    vi.mocked(useIsSolanaEnabled.getState).mockReturnValue(false);
    const legacy = { address: ADDRESS, privateKey: 'existing-evm-material', version: 1 };
    vi.mocked(kc.getObject).mockResolvedValue({ value: legacy, error: undefined });
    await expect(getPrivateKey(ADDRESS)).resolves.toEqual(legacy);
    await expect(savePrivateKey(ADDRESS, legacy.privateKey, { androidEncryptionPin: '1234' })).resolves.toBeUndefined();
    expect(kc.getObject).toHaveBeenCalledWith(`${ADDRESS}_rainbowPrivateKey`, expect.any(Object));
    expect(kc.setObject).toHaveBeenCalledWith(`${ADDRESS}_rainbowPrivateKey`, legacy, {
      accessControl: 'private',
      androidEncryptionPin: '1234',
    });
    expect(kc.getPrivateString).not.toHaveBeenCalled();
    expect(kc.setPrivateString).not.toHaveBeenCalled();
  });

  it('retains the existing EVM checksum fallback', async () => {
    const checksum = '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf';
    const legacy = { address: checksum, privateKey: 'existing-evm-material', version: 1 };
    vi.mocked(kc.getObject)
      .mockResolvedValueOnce({ value: undefined, error: kc.ErrorType.Unavailable })
      .mockResolvedValueOnce({ value: legacy, error: undefined });
    await expect(getPrivateKey(checksum.toLowerCase())).resolves.toEqual(legacy);
    expect(kc.getObject).toHaveBeenNthCalledWith(1, `${checksum.toLowerCase()}_rainbowPrivateKey`, expect.any(Object));
    expect(kc.getObject).toHaveBeenNthCalledWith(2, `${checksum}_rainbowPrivateKey`, expect.any(Object));
  });

  it.each([
    `eip155:1:${ADDRESS}`,
    `eip155:_:${ADDRESS}`,
    `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:${record.address}`,
    `solana:_:${record.address}`,
    'not-an-address',
  ])('rejects qualified or invalid addresses before authentication or storage %#', async address => {
    await expect(getPrivateKey(address)).resolves.toBeNull();
    await expect(savePrivateKey(address, record.privateKey)).rejects.toThrow('raw wallet address');
    await expect(removeAccountKey(address)).resolves.toEqual({ status: 'invalid-record' });
    expect(kc.getPrivateString).not.toHaveBeenCalled();
    expect(kc.getObject).not.toHaveBeenCalled();
    expect(kc.maybeAuthenticateWithPIN).not.toHaveBeenCalled();
    expect(legacyKeychain.getPrivateAccessControlOptions).not.toHaveBeenCalled();
    expect(kc.setObject).not.toHaveBeenCalled();
    expect(kc.remove).not.toHaveBeenCalled();
  });

  it.each([
    '{',
    JSON.stringify({ ...record, version: 2 }),
    JSON.stringify({ ...record, address: '11111111111111111111111111111111' }),
    JSON.stringify({ ...record, privateKey: 'invalid' }),
  ])('rejects corrupt or misbound records without overwriting them %#', async value => {
    vi.mocked(kc.getPrivateString).mockResolvedValue({ status: 'ok', value });
    await expect(getPrivateKey(record.address)).resolves.toBeNull();
    await expect(savePrivateKey(record.address, record.privateKey)).rejects.toThrow('Unable to save private key');
    expect(kc.setPrivateString).not.toHaveBeenCalled();
  });

  it('rejects null and mismatched software keys for Solana before writing', async () => {
    await expect(savePrivateKey(record.address, null)).rejects.toThrow('software private key');
    await expect(savePrivateKey('11111111111111111111111111111111', record.privateKey)).rejects.toThrow('address-mismatch');
    expect(kc.getPrivateString).not.toHaveBeenCalled();
    expect(kc.setPrivateString).not.toHaveBeenCalled();
  });

  it('serializes concurrent writes and scoped removal by raw address', async () => {
    let stored: string | undefined;
    vi.mocked(kc.getPrivateString).mockImplementation(async () => (stored ? { status: 'ok', value: stored } : { status: 'missing-key' }));
    vi.mocked(kc.setPrivateString).mockImplementation(async (_key, value) => {
      stored = value;
      return { status: 'ok', value: undefined };
    });
    await Promise.all([
      savePrivateKey(record.address, record.privateKey),
      savePrivateKey(record.address, record.privateKey),
      removeAccountKey(record.address),
    ]);
    expect(kc.setPrivateString).toHaveBeenCalledTimes(1);
    expect(kc.remove).toHaveBeenCalledWith(storageKey);
    expect(vi.mocked(kc.remove).mock.invocationCallOrder[0]).toBeGreaterThan(vi.mocked(kc.setPrivateString).mock.invocationCallOrder[0]);
  });

  it('blocks Solana operations when disabled', async () => {
    vi.mocked(useIsSolanaEnabled.getState).mockReturnValue(false);
    await expect(getPrivateKey(record.address)).resolves.toBeNull();
    await expect(savePrivateKey(record.address, record.privateKey)).rejects.toThrow('disabled');
    await expect(removeAccountKey(record.address)).resolves.toEqual({ status: 'disabled' });
    expect(kc.getPrivateString).not.toHaveBeenCalled();
    expect(kc.remove).not.toHaveBeenCalled();
  });

  it('rejects a flag change during authentication without returning a key or writing', async () => {
    vi.mocked(kc.getPrivateString).mockImplementation(async () => {
      vi.mocked(useIsSolanaEnabled.getState).mockReturnValue(false);
      return { status: 'ok', value: JSON.stringify(record) };
    });
    await expect(getPrivateKey(record.address)).resolves.toBeNull();
    vi.mocked(useIsSolanaEnabled.getState).mockReturnValue(true);
    await expect(savePrivateKey(record.address, record.privateKey)).rejects.toThrow('disabled');
    expect(kc.setPrivateString).not.toHaveBeenCalled();
  });

  it('still validates source-wallet kind when reading a mnemonic', async () => {
    vi.mocked(kc.getObject).mockResolvedValue({
      value: { version: 1, wallets: { wallet_1: { ...WALLETS.wallet_1, type: EthereumWalletType.readOnly } } },
      error: undefined,
    });
    await expect(readWalletMnemonic('wallet_1')).resolves.toEqual({ status: 'unsupported-source' });
    expect(kc.getPrivateString).not.toHaveBeenCalled();
  });

  it('returns unavailable on failed scoped deletion', async () => {
    vi.mocked(kc.remove).mockRejectedValue(new Error('native failure'));
    await expect(removeAccountKey(record.address)).resolves.toEqual({ status: 'unavailable' });
  });
});
