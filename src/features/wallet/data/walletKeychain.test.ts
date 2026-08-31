import * as kc from '@/features/local-auth/keychain';
import { addressKey, allWalletsKey } from '@/features/local-auth/keychainConstants';
import * as legacyKeychain from '@/features/local-auth/legacyKeychain';
import { EncryptionType, type AllRainbowWallets } from '@/features/wallet/types';
import { EthereumWalletType } from '@/helpers/walletTypes';

import {
  checkWalletsDamagedState,
  getAllWallets,
  getPrivateKey,
  loadAddress,
  migrateWalletSecrets,
  saveAllWallets,
  saveKeyForWallet,
} from './walletKeychain';

jest.mock('@/features/local-auth/keychain', () => ({
  ErrorType: {
    Unknown: 0,
    UserCanceled: -1,
    NotAuthenticated: -2,
    Unavailable: -3,
  },
  has: jest.fn(),
  getObject: jest.fn(),
  isPasscodeAuthAvailable: jest.fn(),
  maybeAuthenticateWithPIN: jest.fn().mockResolvedValue(undefined),
  publicAccessControlOptions: { accessible: 'public' },
  setObject: jest.fn(),
}));

jest.mock('@/features/local-auth/legacyKeychain', () => ({
  loadString: jest.fn(),
  publicAccessControlOptions: { accessible: 'public' },
  saveString: jest.fn(),
}));

jest.mock('@/navigation/Navigation', () => ({
  __esModule: true,
  default: { handleAction: jest.fn() },
}));

jest.mock('@/navigation/routesNames', () => ({
  __esModule: true,
  default: { WALLET_ERROR_SHEET: 'WalletErrorSheet' },
}));

jest.mock('@/utils/wallet', () => ({
  deriveAccountFromMnemonic: jest.fn(),
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
  jest.clearAllMocks();
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
    jest.mocked(kc.getObject).mockResolvedValue({ value: storedWallets, error: undefined });

    await expect(getAllWallets()).resolves.toEqual(storedWallets);
  });

  it('returns only string account addresses from legacy storage', async () => {
    jest.mocked(legacyKeychain.loadString).mockResolvedValueOnce(ADDRESS).mockResolvedValueOnce(kc.ErrorType.UserCanceled);

    await expect(loadAddress()).resolves.toBe(ADDRESS);
    await expect(loadAddress()).resolves.toBeNull();
    expect(legacyKeychain.loadString).toHaveBeenCalledWith(addressKey);
  });

  it('preserves keychain cancellation when loading a private key', async () => {
    jest.mocked(kc.getObject).mockResolvedValue({ value: undefined, error: kc.ErrorType.UserCanceled });

    await expect(getPrivateKey(ADDRESS)).resolves.toBe(kc.ErrorType.UserCanceled);
  });

  it.each([kc.ErrorType.UserCanceled, kc.ErrorType.NotAuthenticated])(
    'does not complete legacy migration after keychain error %s',
    async error => {
      jest.mocked(legacyKeychain.loadString).mockResolvedValue(error);

      await expect(migrateWalletSecrets()).resolves.toBeNull();
      expect(legacyKeychain.saveString).not.toHaveBeenCalled();
    }
  );

  it('rejects a malformed hardware wallet key before writing it', async () => {
    await expect(saveKeyForWallet(ADDRESS, 'not-a-hardware-key', true)).rejects.toThrow('Invalid hardware wallet key');
    expect(kc.setObject).not.toHaveBeenCalled();
  });

  it('marks an iOS wallet as damaged when its keychain key cannot be checked', async () => {
    jest.mocked(kc.isPasscodeAuthAvailable).mockResolvedValue(true);
    jest.mocked(kc.has).mockRejectedValue(new Error('Keychain unavailable'));

    await expect(checkWalletsDamagedState(WALLETS)).resolves.toEqual(new Map([['wallet_1', true]]));
  });
});
