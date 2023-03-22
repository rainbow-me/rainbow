import { captureException } from '@sentry/react-native';
import { endsWith } from 'lodash';
import {
  getSupportedBiometryType,
  Options,
  requestSharedWebCredentials,
  setSharedWebCredentials,
} from 'react-native-keychain';
import {
  CLOUD_BACKUP_ERRORS,
  encryptAndSaveDataToCloud,
  getDataFromCloud,
} from '@/handlers/cloudBackup';
import WalletBackupTypes from '../helpers/walletBackupTypes';
import WalletTypes from '../helpers/walletTypes';
import {
  allWalletsKey,
  pinKey,
  privateKeyKey,
  seedPhraseKey,
  selectedWalletKey,
} from '@/utils/keychainConstants';
import * as keychain from './keychain';
import {
  AllRainbowWallets,
  allWalletsVersion,
  createWallet,
  RainbowWallet,
} from './wallet';
import { analytics } from '@/analytics';
import oldLogger from '@/utils/logger';
import { logger, RainbowError } from '@/logger';
import { IS_ANDROID } from '@/env';
import AesEncryptor from '../handlers/aesEncryption';
import {
  authenticateWithPINAndCreateIfNeeded,
  decryptPIN,
} from '@/handlers/authentication';
import { setIsWalletLoading } from '@/redux/wallets';
import store from '@/redux/store';

const encryptor = new AesEncryptor();
const PIN_REGEX = /^\d{4}$/;

type BackupPassword = string;

interface BackedUpData {
  [key: string]: string;
}

interface BackupUserData {
  wallets: AllRainbowWallets;
}

async function extractSecretsForWallet(wallet: RainbowWallet) {
  const allKeys = await keychain.loadAllKeys();
  if (!allKeys) throw new Error(CLOUD_BACKUP_ERRORS.KEYCHAIN_ACCESS_ERROR);
  const secrets = {} as { [key: string]: string };

  const allowedPkeysKeys = wallet?.addresses?.map(
    account => `${account.address}_${privateKeyKey}`
  );

  allKeys.forEach(item => {
    // Ignore allWalletsKey
    if (item.username === allWalletsKey) {
      return;
    }

    // Ignore selected wallet
    if (item.username === selectedWalletKey) {
      return;
    }

    // Ignore another wallets seeds
    if (
      item.username.indexOf(`_${seedPhraseKey}`) !== -1 &&
      item.username !== `${wallet.id}_${seedPhraseKey}`
    ) {
      return;
    }

    // Ignore other wallets PKeys
    if (
      item.username.indexOf(`_${privateKeyKey}`) !== -1 &&
      !(allowedPkeysKeys?.indexOf(item.username) > -1)
    ) {
      return;
    }

    secrets[item.username] = item.password;
  });
  return secrets;
}

export async function backupWalletToCloud({
  password,
  wallet,
  userPIN,
}: {
  password: BackupPassword;
  wallet: RainbowWallet;
  userPIN?: string;
}) {
  const now = Date.now();
  const secrets = await extractSecretsForWallet(wallet);
  const processedSecrets = await decryptAllPinEncryptedSecretsIfNeeded(
    secrets,
    userPIN
  );
  const data = {
    createdAt: now,
    secrets: processedSecrets,
  };
  return encryptAndSaveDataToCloud(data, password, `backup_${now}.json`);
}

export async function addWalletToCloudBackup({
  password,
  wallet,
  filename,
  userPIN,
}: {
  password: BackupPassword;
  wallet: RainbowWallet;
  filename: string;
  userPIN?: string;
}): Promise<null | boolean> {
  // @ts-ignore
  const backup = await getDataFromCloud(password, filename);
  const now = Date.now();
  const newSecretsToBeAddedToBackup = await extractSecretsForWallet(wallet);
  const processedNewSecrets = await decryptAllPinEncryptedSecretsIfNeeded(
    newSecretsToBeAddedToBackup,
    userPIN
  );
  backup.updatedAt = now;
  // Merge existing secrets with the ones from this wallet
  backup.secrets = {
    ...backup.secrets,
    ...processedNewSecrets,
  };
  return encryptAndSaveDataToCloud(backup, password, filename);
}

async function decryptAllPinEncryptedSecretsIfNeeded(
  secrets: Record<string, string>,
  userPIN?: string
) {
  const processedSecrets = { ...secrets };
  // We need to decrypt PIN code encrypted secrets before backup
  const hasBiometricsEnabled = await getSupportedBiometryType();
  if (IS_ANDROID && !hasBiometricsEnabled) {
    /*
     * The PIN code is passed as an argument.
     * Authentication is handled at the call site.
     * If we don't have PIN information, we throw an error.
     * Both for the developer and the user if something goes wrong.
     */
    if (userPIN === undefined) {
      throw new Error(CLOUD_BACKUP_ERRORS.MISSING_PIN);
    }

    // We go through each secret here and try to decrypt it if it's needed
    await Promise.all(
      Object.keys(processedSecrets).map(async key => {
        const secret = processedSecrets[key];
        const theKeyIsASeedPhrase = endsWith(key, seedPhraseKey);
        const theKeyIsAPrivateKey = endsWith(key, privateKeyKey);

        if (theKeyIsASeedPhrase) {
          const parsedSecret = JSON.parse(secret);
          const seedphrase = parsedSecret.seedphrase;

          if (userPIN && seedphrase && seedphrase?.includes('cipher')) {
            const decryptedSeedPhrase = await encryptor.decrypt(
              userPIN,
              seedphrase
            );
            processedSecrets[key] = JSON.stringify({
              ...parsedSecret,
              seedphrase: decryptedSeedPhrase,
            });
          }
        } else if (theKeyIsAPrivateKey) {
          const parsedSecret = JSON.parse(secret);
          const privateKey = parsedSecret.privateKey;

          if (userPIN && privateKey && privateKey.includes('cipher')) {
            const decryptedPrivateKey = await encryptor.decrypt(
              userPIN,
              privateKey
            );
            processedSecrets[key] = JSON.stringify({
              ...parsedSecret,
              privateKey: decryptedPrivateKey,
            });
          }
        }
      })
    );

    return processedSecrets;
  } else {
    return secrets;
  }
}

export function findLatestBackUp(
  wallets: AllRainbowWallets | null
): string | null {
  let latestBackup: string | null = null;
  let filename: string | null = null;

  if (wallets) {
    Object.values(wallets).forEach(wallet => {
      // Check if there's a wallet backed up
      if (
        wallet.backedUp &&
        wallet.backupDate &&
        wallet.backupFile &&
        wallet.backupType === WalletBackupTypes.cloud
      ) {
        // If there is one, let's grab the latest backup
        if (!latestBackup || wallet.backupDate > latestBackup) {
          filename = wallet.backupFile;
          latestBackup = wallet.backupDate;
        }
      }
    });
  }
  return filename;
}

export const RestoreCloudBackupResultStates = {
  success: 'success',
  failedWhenRestoring: 'failedWhenRestoring',
  incorrectPassword: 'incorrectPassword',
  incorrectPinCode: 'incorrectPinCode',
} as const;

type RestoreCloudBackupResultStatesType = typeof RestoreCloudBackupResultStates[keyof typeof RestoreCloudBackupResultStates];

/**
 * Restores a cloud backup.
 */
export async function restoreCloudBackup({
  password,
  userData,
  backupSelected,
}: {
  password: BackupPassword;
  userData: BackupUserData | null;
  backupSelected: string | null;
}): Promise<RestoreCloudBackupResultStatesType> {
  // We support two flows
  // Restoring from the welcome screen, which uses the userData to rebuild the wallet
  // Restoring a specific backup from settings => Backup, which uses only the keys stored.

  try {
    const filename =
      backupSelected || (userData && findLatestBackUp(userData?.wallets));
    if (!filename) {
      return RestoreCloudBackupResultStates.failedWhenRestoring;
    }
    // 2- download that backup
    // @ts-ignore
    const data = await getDataFromCloud(password, filename);
    if (!data) {
      return RestoreCloudBackupResultStates.incorrectPassword;
    }

    let userPIN: string | undefined;
    const hasBiometricsEnabled = await getSupportedBiometryType();
    if (IS_ANDROID && !hasBiometricsEnabled) {
      const currentLoadingState = store.getState().wallets.isWalletLoading;
      try {
        // we need to hide the top level loading indicator for a while
        // to not cover the PIN screen
        store.dispatch(setIsWalletLoading(null));
        userPIN = await authenticateWithPINAndCreateIfNeeded();
        store.dispatch(setIsWalletLoading(currentLoadingState));
      } catch (e) {
        store.dispatch(setIsWalletLoading(currentLoadingState));
        return RestoreCloudBackupResultStates.incorrectPinCode;
      }
    }

    const dataToRestore = {
      ...data.secrets,
    };

    let restoredSuccessfully = false;
    if (userData) {
      // Restore only wallets that were backed up in cloud
      // or wallets that are read-only
      const walletsToRestore: AllRainbowWallets = {};
      Object.values(userData?.wallets ?? {}).forEach(wallet => {
        if (
          (wallet.backedUp &&
            wallet.backupDate &&
            wallet.backupFile &&
            wallet.backupType === WalletBackupTypes.cloud) ||
          wallet.type === WalletTypes.readOnly
        ) {
          walletsToRestore[wallet.id] = wallet;
        }
      });

      // All wallets
      dataToRestore[allWalletsKey] = {
        version: allWalletsVersion,
        wallets: walletsToRestore,
      };
      restoredSuccessfully = await restoreCurrentBackupIntoKeychain(
        dataToRestore,
        userPIN
      );
    } else {
      restoredSuccessfully = await restoreSpecificBackupIntoKeychain(
        dataToRestore
      );
    }

    return restoredSuccessfully
      ? RestoreCloudBackupResultStates.success
      : RestoreCloudBackupResultStates.failedWhenRestoring;
  } catch (error) {
    const message = (error as Error).message;
    if (message === CLOUD_BACKUP_ERRORS.ERROR_DECRYPTING_DATA) {
      return RestoreCloudBackupResultStates.incorrectPassword;
    }
    logger.error(new RainbowError('Error while restoring back up'), {
      message,
    });
    return RestoreCloudBackupResultStates.failedWhenRestoring;
  }
}

async function restoreSpecificBackupIntoKeychain(
  backedUpData: BackedUpData
): Promise<boolean> {
  const encryptedBackupPinData = backedUpData[pinKey];

  try {
    // Re-import all the seeds (and / or pkeys) one by one
    for (const key of Object.keys(backedUpData)) {
      if (endsWith(key, seedPhraseKey)) {
        const valueStr = backedUpData[key];
        const parsedValue = JSON.parse(valueStr);
        // We only need to decrypt from backup since createWallet encrypts itself
        let processedSeedPhrase = parsedValue.seedphrase;
        if (processedSeedPhrase && processedSeedPhrase.includes('cipher')) {
          const backupPIN = await decryptPIN(encryptedBackupPinData);
          processedSeedPhrase = await decryptSecretFromBackupPinAndEncryptWithNewPin(
            {
              secret: parsedValue.seedphrase,
              backupPIN,
            }
          );
        }
        await createWallet({ seed: processedSeedPhrase, overwrite: true });
      }
    }
    return true;
  } catch (e) {
    oldLogger.sentry('error in restoreSpecificBackupIntoKeychain');
    captureException(e);
    return false;
  }
}

async function restoreCurrentBackupIntoKeychain(
  backedUpData: BackedUpData,
  newPIN?: string
): Promise<boolean> {
  try {
    // Access control config per each type of key
    const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();
    const encryptedBackupPinData = backedUpData[pinKey];
    const backupPIN = await decryptPIN(encryptedBackupPinData);

    await Promise.all(
      Object.keys(backedUpData).map(async key => {
        let value = backedUpData[key];
        const theKeyIsASeedPhrase = endsWith(key, seedPhraseKey);
        const theKeyIsAPrivateKey = endsWith(key, privateKeyKey);
        const accessControl: Options =
          theKeyIsASeedPhrase || theKeyIsAPrivateKey
            ? privateAccessControlOptions
            : keychain.publicAccessControlOptions;

        /*
         * Backups that were saved encrypted with PIN to the cloud need to be
         * decrypted with the backup PIN first, and then if we still need
         * to store them as encrypted,
         * we need to re-encrypt them with a new PIN
         */
        if (theKeyIsASeedPhrase) {
          const parsedValue = JSON.parse(value);
          parsedValue.seedphrase = await decryptSecretFromBackupPinAndEncryptWithNewPin(
            {
              secret: parsedValue.seedphrase,
              newPIN,
              backupPIN,
            }
          );
          value = JSON.stringify(parsedValue);
        } else if (theKeyIsAPrivateKey) {
          const parsedValue = JSON.parse(value);
          parsedValue.privateKey = await decryptSecretFromBackupPinAndEncryptWithNewPin(
            {
              secret: parsedValue.privateKey,
              newPIN,
              backupPIN,
            }
          );
          value = JSON.stringify(parsedValue);
        }

        /*
         * Since we're decrypting the data that was saved as PIN code encrypted,
         * we will allow the user to create a new PIN code.
         * We store the old PIN code in the backup, but we don't want to restore it,
         * since it will override the new PIN code that we just saved to keychain.
         */
        if (key === pinKey) {
          return;
        }

        if (typeof value === 'string') {
          return keychain.saveString(key, value, accessControl);
        } else {
          return keychain.saveObject(key, value, accessControl);
        }
      })
    );

    return true;
  } catch (e) {
    oldLogger.sentry('error in restoreBackupIntoKeychain');
    captureException(e);
    return false;
  }
}

async function decryptSecretFromBackupPinAndEncryptWithNewPin({
  secret,
  newPIN,
  backupPIN,
}: {
  secret?: string;
  newPIN?: string;
  backupPIN?: string;
}) {
  let processedSecret = secret;

  if (!processedSecret) {
    return processedSecret;
  }

  /*
   * We need to decrypt the secret with the PIN stored in the backup
   * It is required for old backups created before we started storing
   * secrets in backups without PIN encryption
   */
  if (
    backupPIN &&
    processedSecret.includes('cipher') &&
    PIN_REGEX.test(backupPIN)
  ) {
    const decryptedSecret = await encryptor.decrypt(backupPIN, processedSecret);

    if (decryptedSecret) {
      processedSecret = decryptedSecret;
    } else {
      logger.error(
        new RainbowError(
          'Failed to decrypt backed up seed phrase using backup PIN.'
        )
      );
      return processedSecret;
    }
  }

  /*
   * For devices that don't support biometrics or for users without
   * biometrics enabled, we need to encrypt the secret with a PIN code
   * for storage in Android device keychain
   */
  if (newPIN && PIN_REGEX.test(newPIN)) {
    const encryptedSecret = await encryptor.encrypt(newPIN, processedSecret);

    if (encryptedSecret) {
      processedSecret = encryptedSecret;
    } else {
      logger.error(
        new RainbowError('Failed to encrypt seed phrase with new PIN.')
      );
    }
  }

  return processedSecret;
}

// Attempts to save the password to decrypt the backup from the iCloud keychain
export async function saveBackupPassword(
  password: BackupPassword
): Promise<void> {
  try {
    if (ios) {
      await setSharedWebCredentials('rainbow.me', 'Backup Password', password);
      analytics.track('Saved backup password on iCloud');
    }
  } catch (e) {
    analytics.track("Didn't save backup password on iCloud");
  }
}

// Attempts to fetch the password to decrypt the backup from the iCloud keychain
export async function fetchBackupPassword(): Promise<null | BackupPassword> {
  if (android) {
    return null;
  }

  try {
    const results = await requestSharedWebCredentials();
    if (results) {
      return results.password as BackupPassword;
    }
    return null;
  } catch (e) {
    oldLogger.sentry('Error while fetching backup password', e);
    captureException(e);
    return null;
  }
}
