import { Platform } from 'react-native';

import { HDNode } from '@ethersproject/hdnode';
import { Wallet } from '@ethersproject/wallet';
import { toChecksumAddress } from 'ethereumjs-util';
import { type GetOptions, type SetOptions } from 'react-native-keychain';

import { type EthereumAddress } from '@/entities/wallet';
import * as kc from '@/features/local-auth/keychain';
import {
  addressKey,
  allWalletsKey,
  oldSeedPhraseMigratedKey,
  pinKey,
  privateKeyKey,
  seedPhraseKey,
  selectedWalletKey,
} from '@/features/local-auth/keychainConstants';
import * as keychain from '@/features/local-auth/legacyKeychain';
import { identifyWalletType, type EthereumPrivateKey, type EthereumWalletSeed } from '@/features/wallet/core/walletDerivation';
import { getHdPath, WalletLibraryType } from '@/features/wallet/core/walletLibrary';
import {
  EncryptionType,
  type AllRainbowWallets,
  type AllRainbowWalletsData,
  type HardwareKey,
  type MigratedSecretsResult,
  type PrivateKeyData,
  type RainbowSelectedWalletData,
  type RainbowWallet,
  type SeedPhraseData,
} from '@/features/wallet/types';
import { addHexPrefix } from '@/handlers/web3';
import { EthereumWalletType } from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { ensureError, logger, RainbowError } from '@/logger';
import { DebugContext } from '@/logger/debugContext';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { deriveAccountFromMnemonic } from '@/utils/wallet';

const PRIVATE_KEY_VERSION = 1;
const SEED_PHRASE_VERSION = 1;
const SELECTED_WALLET_VERSION = 1;
export const ALL_WALLETS_VERSION = 1;

export const createdWithBiometricError = 'createdWithBiometricError';

const authenticationPrompt = {
  get title(): string {
    return i18n.t(i18n.l.wallet.authenticate.please);
  },
};

export function isHardwareWalletKey(key: string | null): key is HardwareKey {
  if (!key) return false;
  const [deviceId, index, ...remainder] = key.split('/');
  return Boolean(deviceId && index && remainder.length === 0 && /^\d+$/.test(index));
}

async function loadLegacySeedPhrase(): Promise<EthereumWalletSeed | kc.ErrorType.UserCanceled | kc.ErrorType.NotAuthenticated | null> {
  const seedPhrase = await keychain.loadString(seedPhraseKey, { authenticationPrompt });
  if (seedPhrase === kc.ErrorType.UserCanceled || seedPhrase === kc.ErrorType.NotAuthenticated) return seedPhrase;
  return typeof seedPhrase === 'string' ? seedPhrase : null;
}

export async function loadAddress(): Promise<EthereumAddress | null> {
  const address = await keychain.loadString(addressKey);
  return typeof address === 'string' ? address : null;
}

export async function saveAddress(
  address: EthereumAddress,
  accessControlOptions: kc.KeychainOptions<SetOptions> = keychain.publicAccessControlOptions
): Promise<void> {
  return keychain.saveString(addressKey, address, accessControlOptions);
}

export async function saveKeyForWallet(
  address: EthereumAddress,
  walletKey: EthereumPrivateKey | HardwareKey | null,
  hardware: boolean,
  { androidEncryptionPin }: Pick<kc.KeychainOptions<SetOptions>, 'androidEncryptionPin'> = {}
): Promise<void> {
  if (hardware) {
    if (walletKey !== null && !isHardwareWalletKey(walletKey)) {
      throw new Error('[wallet]: Invalid hardware wallet key');
    }
    return saveHardwareKey(address, walletKey);
  }
  return savePrivateKey(address, walletKey, { androidEncryptionPin });
}

export async function getKeyForWallet(
  address: EthereumAddress,
  hardware: boolean
): Promise<PrivateKeyData | null | kc.ErrorType.UserCanceled | kc.ErrorType.NotAuthenticated> {
  return hardware ? getHardwareKey(address) : getPrivateKey(address);
}

export async function savePrivateKey(
  address: EthereumAddress,
  privateKey: EthereumPrivateKey | HardwareKey | null,
  { androidEncryptionPin }: Pick<kc.KeychainOptions<SetOptions>, 'androidEncryptionPin'> = {}
): Promise<void> {
  const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();
  const key = `${address}_${privateKeyKey}`;
  const value: PrivateKeyData = {
    address,
    privateKey,
    version: PRIVATE_KEY_VERSION,
  };

  await kc.setObject(key, value, {
    ...privateAccessControlOptions,
    androidEncryptionPin,
  });
}

export async function saveHardwareKey(address: EthereumAddress, privateKey: HardwareKey | null): Promise<void> {
  const key = `${address}_${privateKeyKey}`;
  const value: PrivateKeyData = {
    address,
    privateKey,
    version: PRIVATE_KEY_VERSION,
  };

  await kc.setObject(key, value, keychain.publicAccessControlOptions);
}

export async function getPrivateKey(
  address: EthereumAddress
): Promise<PrivateKeyData | null | kc.ErrorType.UserCanceled | kc.ErrorType.NotAuthenticated> {
  try {
    const key = `${address}_${privateKeyKey}`;
    const androidEncryptionPin = await kc.maybeAuthenticateWithPIN();
    const { value: privateKeyData, error } = await kc.getObject<PrivateKeyData>(key, {
      authenticationPrompt,
      androidEncryptionPin,
    });

    switch (error) {
      case kc.ErrorType.UserCanceled:
      case kc.ErrorType.NotAuthenticated:
        return error;
      case kc.ErrorType.Unavailable: {
        const checksumAddress = toChecksumAddress(address);
        if (address !== checksumAddress) return getPrivateKey(checksumAddress);
        logger.error(new RainbowError('KC unavailable for PKEY lookup'), { error });
        break;
      }
      default:
        if (error) logger.error(new RainbowError('KC unknown error for PKEY lookup'), { error });
    }

    return privateKeyData ?? null;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error in getPrivateKey'), { error });
    return null;
  }
}

export async function getHardwareKey(address: EthereumAddress): Promise<PrivateKeyData | null> {
  try {
    const key = `${address}_${privateKeyKey}`;
    const { value } = await kc.getObject<PrivateKeyData>(key);
    return value ?? null;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error in getHardwareKey'), { error });
    return null;
  }
}

export async function loadPrivateKey(
  address: EthereumAddress,
  hardware: boolean
): Promise<EthereumPrivateKey | null | kc.ErrorType.UserCanceled | kc.ErrorType.NotAuthenticated> {
  try {
    const isSeedPhraseMigrated = await keychain.loadString(oldSeedPhraseMigratedKey);
    let privateKey: EthereumPrivateKey | HardwareKey | null | undefined;

    if (!isSeedPhraseMigrated) {
      privateKey = (await migrateWalletSecrets())?.privateKey;
    }

    if (!privateKey) {
      const privateKeyData = await getKeyForWallet(address, hardware);
      if (privateKeyData === kc.ErrorType.UserCanceled || privateKeyData === kc.ErrorType.NotAuthenticated) return privateKeyData;
      privateKey = privateKeyData?.privateKey;
    }

    return privateKey ?? null;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error loading private key'), { error });
    return null;
  }
}

export async function saveSeedPhrase(
  seedphrase: EthereumWalletSeed,
  keychainId: RainbowWallet['id'],
  { androidEncryptionPin }: Pick<kc.KeychainOptions<SetOptions>, 'androidEncryptionPin'> = {}
): Promise<void> {
  const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();
  const key = `${keychainId}_${seedPhraseKey}`;
  const value: SeedPhraseData = {
    id: keychainId,
    seedphrase,
    version: SEED_PHRASE_VERSION,
  };

  return kc.setObject(key, value, {
    ...privateAccessControlOptions,
    androidEncryptionPin,
  });
}

export async function getSeedPhrase(
  id: RainbowWallet['id'],
  { androidEncryptionPin }: Pick<kc.KeychainOptions<GetOptions>, 'androidEncryptionPin'> = {}
): Promise<SeedPhraseData | null> {
  try {
    const key = `${id}_${seedPhraseKey}`;
    const { value, error } = await kc.getObject<SeedPhraseData>(key, {
      authenticationPrompt,
      androidEncryptionPin,
    });

    if (error === kc.ErrorType.UserCanceled) return null;
    if (!value) {
      Navigation.handleAction(Routes.WALLET_ERROR_SHEET);
      return null;
    }
    return value;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error in getSeedPhrase'), { error });
    return null;
  }
}

export async function setSelectedWallet(wallet: RainbowWallet): Promise<void> {
  const value: RainbowSelectedWalletData = {
    version: SELECTED_WALLET_VERSION,
    wallet,
  };
  return kc.setObject(selectedWalletKey, value, keychain.publicAccessControlOptions);
}

export async function resetSelectedWallet(): Promise<void> {
  return keychain.saveObject(selectedWalletKey, {}, keychain.publicAccessControlOptions);
}

export async function getSelectedWallet(): Promise<RainbowSelectedWalletData | null> {
  try {
    const { value } = await kc.getObject<RainbowSelectedWalletData>(selectedWalletKey);
    return value ?? null;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error in getSelectedWallet'), { error });
    return null;
  }
}

export async function saveAllWallets(wallets: AllRainbowWallets): Promise<void> {
  const value: AllRainbowWalletsData = {
    version: ALL_WALLETS_VERSION,
    wallets,
  };
  await kc.setObject(allWalletsKey, value, keychain.publicAccessControlOptions);
}

export async function getAllWallets(): Promise<AllRainbowWalletsData | null> {
  try {
    const { value } = await kc.getObject<AllRainbowWalletsData>(allWalletsKey);
    return value ?? null;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error in getAllWallets'), { error });
    return null;
  }
}

/** Moves legacy seed and private-key records into per-wallet keychain entries. */
export async function migrateWalletSecrets(): Promise<MigratedSecretsResult | null> {
  try {
    logger.debug('[wallet]: Migrating wallet secrets', {}, DebugContext.wallet);
    const seedphrase = await loadLegacySeedPhrase();

    if (seedphrase === kc.ErrorType.UserCanceled || seedphrase === kc.ErrorType.NotAuthenticated) return null;

    if (!seedphrase) {
      await keychain.saveString(oldSeedPhraseMigratedKey, 'true', keychain.publicAccessControlOptions);
      return null;
    }

    const type = identifyWalletType(seedphrase);
    let hdnode: HDNode | undefined;
    let existingAccount: Wallet | undefined;

    switch (type) {
      case EthereumWalletType.privateKey:
        existingAccount = new Wallet(addHexPrefix(seedphrase));
        break;
      case EthereumWalletType.mnemonic: {
        const { wallet } = await deriveAccountFromMnemonic(seedphrase);
        existingAccount = new Wallet(addHexPrefix(wallet.getPrivateKey().toString('hex')));
        break;
      }
      case EthereumWalletType.seed:
        hdnode = HDNode.fromSeed(seedphrase);
        break;
    }

    if (!existingAccount && hdnode) {
      const node = hdnode.derivePath(getHdPath({ type: WalletLibraryType.ethers, index: 0 }));
      existingAccount = new Wallet(node.privateKey);
    }
    if (!existingAccount) return null;

    if (!(await keychain.hasKey(`${existingAccount.address}_${privateKeyKey}`))) {
      await saveKeyForWallet(existingAccount.address, existingAccount.privateKey, false);
    }

    const wallet = (await getSelectedWallet())?.wallet;
    if (!wallet) return null;

    if (!(await keychain.hasKey(`${wallet.id}_${seedPhraseKey}`))) {
      await saveSeedPhrase(seedphrase, wallet.id);
    }

    await keychain.saveString(oldSeedPhraseMigratedKey, 'true', keychain.publicAccessControlOptions);
    return {
      hdnode,
      privateKey: existingAccount.privateKey,
      seedphrase,
      type,
    };
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error while migrating secrets'), { error });
    return null;
  }
}

export async function cleanUpWalletKeys(): Promise<boolean> {
  const keys = [addressKey, allWalletsKey, oldSeedPhraseMigratedKey, pinKey, selectedWalletKey];
  try {
    await Promise.all(
      keys.map(async key => {
        try {
          await keychain.remove(key);
        } catch (error) {
          logger.warn('[wallet]: Failure to delete key', { key, error });
        }
      })
    );
    return true;
  } catch {
    return false;
  }
}

/** Returns keychain-backed wallet IDs mapped to their next damaged state. */
export async function checkWalletsDamagedState(wallets: AllRainbowWallets): Promise<Map<string, boolean>> {
  const updatedWalletDamagedStates = new Map<string, boolean>();
  const keychainWallets = Object.values(wallets).filter(wallet => wallet.encryptionType === EncryptionType.keychain);
  if (keychainWallets.length === 0) return updatedWalletDamagedStates;

  const isPasscodeAuthAvailable = await kc.isPasscodeAuthAvailable();
  if (!isPasscodeAuthAvailable) {
    keychainWallets.forEach(wallet => updatedWalletDamagedStates.set(wallet.id, true));
    return updatedWalletDamagedStates;
  }

  if (Platform.OS !== 'ios') return updatedWalletDamagedStates;

  keychainWallets.filter(wallet => wallet.damaged).forEach(wallet => updatedWalletDamagedStates.set(wallet.id, false));

  await Promise.all(
    keychainWallets.map(async wallet => {
      const key = `${wallet.addresses[0].address}_${privateKeyKey}`;
      let hasKey = false;
      try {
        hasKey = await kc.has(key);
      } catch (error) {
        logger.debug(
          `[wallet]: Error checking keychain key existence for wallet ${wallet.id}: ${ensureError(error).message}`,
          {},
          DebugContext.wallet
        );
      }
      if (!hasKey) updatedWalletDamagedStates.set(wallet.id, true);
    })
  );

  return updatedWalletDamagedStates;
}
