import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import { captureException } from '@sentry/react-native';
import { endsWith } from 'lodash';
import { CLOUD_BACKUP_ERRORS, encryptAndSaveDataToCloud, getDataFromCloud } from '@/handlers/cloudBackup';
import WalletBackupTypes from '../helpers/walletBackupTypes';
import WalletTypes from '../helpers/walletTypes';
import { Alert } from '@/components/alerts';
import { allWalletsKey, pinKey, privateKeyKey, seedPhraseKey, selectedWalletKey, identifierForVendorKey } from '@/utils/keychainConstants';
import * as keychain from '@/model/keychain';
import * as kc from '@/keychain';
import { AllRainbowWallets, allWalletsVersion, createWallet, RainbowWallet } from './wallet';
import { analytics } from '@/analytics';
import oldLogger from '@/utils/logger';
import { logger, RainbowError } from '@/logger';
import { IS_ANDROID, IS_DEV } from '@/env';
import AesEncryptor from '../handlers/aesEncryption';
import { authenticateWithPIN, authenticateWithPINAndCreateIfNeeded, decryptPIN } from '@/handlers/authentication';
import * as i18n from '@/languages';
import { getUserError } from '@/hooks/useWalletCloudBackup';
import { cloudPlatform } from '@/utils/platform';
import { setAllWalletsWithIdsAsBackedUp } from '@/redux/wallets';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { clearAllStorages } from './mmkv';
import walletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { getRemoteConfig } from './remoteConfig';

const { DeviceUUID } = NativeModules;
const encryptor = new AesEncryptor();
const PIN_REGEX = /^\d{4}$/;

export interface CloudBackups {
  files: Backup[];
}

export interface Backup {
  isDirectory: boolean;
  isFile: boolean;
  lastModified: string;
  name: string;
  path: string;
  size: number;
  uri: string;
}

export const parseTimestampFromFilename = (filename: string) => {
  return Number(
    filename
      .replace('.backup_', '')
      .replace('backup_', '')
      .replace('.json', '')
      .replace('.icloud', '')
      .replace('rainbow.me/wallet-backups/', '')
  );
};

type BackupPassword = string;

interface BackedUpData {
  [key: string]: string;
}

export interface BackupUserData {
  wallets: AllRainbowWallets;
}

async function extractSecretsForWallet(wallet: RainbowWallet) {
  const allKeys = await keychain.loadAllKeys();
  if (!allKeys) throw new Error(CLOUD_BACKUP_ERRORS.KEYCHAIN_ACCESS_ERROR);
  const secrets = {} as { [key: string]: string };

  const allowedPkeysKeys = wallet?.addresses?.map(account => `${account.address}_${privateKeyKey}`);

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
    if (item.username.indexOf(`_${seedPhraseKey}`) !== -1 && item.username !== `${wallet.id}_${seedPhraseKey}`) {
      return;
    }

    // Ignore other wallets PKeys
    if (item.username.indexOf(`_${privateKeyKey}`) !== -1 && !(allowedPkeysKeys?.indexOf(item.username) > -1)) {
      return;
    }

    secrets[item.username] = item.password;
  });
  return secrets;
}

export async function backupAllWalletsToCloud({
  wallets,
  password,
  latestBackup,
  onError,
  onSuccess,
  dispatch,
}: {
  wallets: AllRainbowWallets;
  password: BackupPassword;
  latestBackup: string | null;
  onError?: (message: string) => void;
  onSuccess?: () => void;
  dispatch: any;
}) {
  let userPIN: string | undefined;
  const hasBiometricsEnabled = await kc.getSupportedBiometryType();
  if (IS_ANDROID && !hasBiometricsEnabled) {
    try {
      userPIN = (await authenticateWithPIN()) ?? undefined;
    } catch (e) {
      onError?.(i18n.t(i18n.l.back_up.wrong_pin));
      return;
    }
  }

  try {
    /**
     * Loop over all keys and decrypt if necessary for android
     * if no latest backup, create first backup with all secrets
     * if latest backup, update updatedAt and add new secrets to the backup
     */

    const allKeys = await keychain.loadAllKeys();
    if (!allKeys) {
      onError?.(i18n.t(i18n.l.back_up.errors.no_keys_found));
      return;
    }

    const allSecrets = allKeys
      .filter(key => {
        return key?.username?.indexOf(seedPhraseKey) !== -1 || key?.username?.indexOf(privateKeyKey) !== -1;
      })
      .reduce(
        (prev, curr) => {
          return {
            ...prev,
            [curr.username]: curr.password,
          };
        },
        {} as { [key: string]: string }
      );

    const now = Date.now();
    logger.debug(`Creating backup with all wallets to ${cloudPlatform}`, {
      category: 'backup',
      time: now,
      label: cloudPlatform,
    });

    let updatedBackupFile: any = null;
    if (!latestBackup) {
      const data = {
        createdAt: now,
        secrets: {},
      };
      const promises = Object.entries(allSecrets).map(async ([username, password]) => {
        const processedNewSecrets = await decryptAllPinEncryptedSecretsIfNeeded({ [username]: password }, userPIN);

        data.secrets = {
          ...data.secrets,
          ...processedNewSecrets,
        };
      });

      await Promise.all(promises);
      updatedBackupFile = await encryptAndSaveDataToCloud(data, password, `backup_${now}.json`);
    } else {
      // if we have a latest backup file, we need to update the updatedAt and add new secrets to the backup file..
      const backup = await getDataFromCloud(password, latestBackup);
      if (!backup) {
        onError?.(i18n.t(i18n.l.back_up.errors.backup_not_found));
        return;
      }

      const data = {
        createdAt: backup.createdAt,
        secrets: backup.secrets,
      };

      const promises = Object.entries(allSecrets).map(async ([username, password]) => {
        const processedNewSecrets = await decryptAllPinEncryptedSecretsIfNeeded({ [username]: password }, userPIN);

        data.secrets = {
          ...data.secrets,
          ...processedNewSecrets,
        };
      });

      await Promise.all(promises);
      updatedBackupFile = await encryptAndSaveDataToCloud(data, password, latestBackup);
    }

    const walletIdsToUpdate = Object.keys(wallets);
    await dispatch(setAllWalletsWithIdsAsBackedUp(walletIdsToUpdate, WalletBackupTypes.cloud, updatedBackupFile));

    logger.debug(`Successfully backed up all wallets to ${cloudPlatform}`, {
      category: 'backup',
      time: now,
      label: cloudPlatform,
    });

    onSuccess?.();
  } catch (error: any) {
    const userError = getUserError(error);
    onError?.(userError);
    captureException(error);
    analytics.track(`Error backing up all wallets to ${cloudPlatform}`, {
      category: 'backup',
      error: userError,
      label: cloudPlatform,
    });
  }
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
  const processedSecrets = await decryptAllPinEncryptedSecretsIfNeeded(secrets, userPIN);
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
  const processedNewSecrets = await decryptAllPinEncryptedSecretsIfNeeded(newSecretsToBeAddedToBackup, userPIN);
  backup.updatedAt = now;
  // Merge existing secrets with the ones from this wallet
  backup.secrets = {
    ...backup.secrets,
    ...processedNewSecrets,
  };
  return encryptAndSaveDataToCloud(backup, password, filename);
}

// we decrypt seedphrase and private key before backing up
export async function decryptAllPinEncryptedSecretsIfNeeded(secrets: Record<string, string>, userPIN?: string) {
  const processedSecrets = { ...secrets };
  // We need to decrypt PIN code encrypted secrets before backup
  const hasBiometricsEnabled = await kc.getSupportedBiometryType();
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
            const decryptedSeedPhrase = await encryptor.decrypt(userPIN, seedphrase);
            processedSecrets[key] = JSON.stringify({
              ...parsedSecret,
              seedphrase: decryptedSeedPhrase,
            });
          }
        } else if (theKeyIsAPrivateKey) {
          const parsedSecret = JSON.parse(secret);
          const privateKey = parsedSecret.privateKey;

          if (userPIN && privateKey && privateKey.includes('cipher')) {
            const decryptedPrivateKey = await encryptor.decrypt(userPIN, privateKey);
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

export function findLatestBackUp(wallets: AllRainbowWallets | null): string | null {
  let latestBackup: number | null = null;
  let filename: string | null = null;

  if (wallets) {
    Object.values(wallets).forEach(wallet => {
      // Check if there's a wallet backed up
      if (wallet.backedUp && wallet.backupDate && wallet.backupFile && wallet.backupType === WalletBackupTypes.cloud) {
        // If there is one, let's grab the latest backup
        if (!latestBackup || Number(wallet.backupDate) > latestBackup) {
          filename = wallet.backupFile;
          latestBackup = Number(wallet.backupDate);
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

type RestoreCloudBackupResultStatesType = (typeof RestoreCloudBackupResultStates)[keyof typeof RestoreCloudBackupResultStates];

/**
 * Helper function to sanitize the filename when we receive it in .icloud format
 * @param filename sometimes input looks like: .backup_<timestamp>.json.icloud
 * @returns backup_<timestamp>.json
 */
const sanitizeFilename = (filename: string) => {
  let sanitizedFilename = filename.replace('.icloud', '');
  if (sanitizedFilename.startsWith('.')) {
    sanitizedFilename = sanitizedFilename.substring(1);
  }

  return sanitizedFilename;
};

/**
 * Restores a cloud backup.
 */
export async function restoreCloudBackup({
  password,
  userData,
  nameOfSelectedBackupFile,
}: {
  password: BackupPassword;
  userData: BackupUserData | undefined;
  nameOfSelectedBackupFile: string;
}): Promise<RestoreCloudBackupResultStatesType> {
  try {
    // 1 - sanitize filename to remove extra things we don't care about
    const filename = sanitizeFilename(nameOfSelectedBackupFile);
    if (!filename) {
      return RestoreCloudBackupResultStates.failedWhenRestoring;
    }
    // 2 - retrieve that backup data
    const data = await getDataFromCloud(password, filename);
    if (!data) {
      return RestoreCloudBackupResultStates.incorrectPassword;
    }

    const dataToRestore = {
      ...data.secrets,
    };

    // ANDROID ONLY - pin auth if biometrics are disabled
    let userPIN: string | undefined;
    const hasBiometricsEnabled = await kc.getSupportedBiometryType();
    if (IS_ANDROID && !hasBiometricsEnabled) {
      try {
        userPIN = await authenticateWithPINAndCreateIfNeeded();
      } catch (e) {
        return RestoreCloudBackupResultStates.incorrectPinCode;
      }
    }

    if (userData) {
      // Restore only wallets that were backed up in cloud
      // or wallets that are read-only
      const walletsToRestore: AllRainbowWallets = {};
      Object.values(userData?.wallets ?? {}).forEach(wallet => {
        if (
          (wallet.backedUp && wallet.backupDate && wallet.backupFile && wallet.backupType === WalletBackupTypes.cloud) ||
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
    }

    const restoredSuccessfully = await restoreSpecificBackupIntoKeychain(dataToRestore, userPIN);
    return restoredSuccessfully ? RestoreCloudBackupResultStates.success : RestoreCloudBackupResultStates.failedWhenRestoring;
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

async function restoreSpecificBackupIntoKeychain(backedUpData: BackedUpData, userPin?: string): Promise<boolean> {
  const encryptedBackupPinData = backedUpData[pinKey];
  const backupPIN = await decryptPIN(encryptedBackupPinData);

  // TODO: Eventual refactor of `createWallet` needed
  /**
   * NOTE: If we import private keys before seed phrases, we won't be able to
   * import the seed phrase as the account will already exist as a private key
   *
   * Quick hack to sort by private keys -> seed phrases so we make sure seed phrases
   * overwrite private keys if they already exist.
   *
   */
  const sortedBackupData = Object.keys(backedUpData).sort((a, b) => {
    if (endsWith(a, privateKeyKey) && !endsWith(b, seedPhraseKey)) {
      return -1;
    }
    if (endsWith(b, privateKeyKey) && !endsWith(a, seedPhraseKey)) {
      return 1;
    }
    return 0;
  });

  try {
    // Re-import all the seeds (and / or pkeys) one by one
    for (const key of sortedBackupData) {
      const theKeyIsASeedPhrase = endsWith(key, seedPhraseKey);
      const theKeyIsAPrivateKey = endsWith(key, privateKeyKey);

      // if the entry isn't a pkey or seed phrase let's continue on...
      if (!theKeyIsASeedPhrase && !theKeyIsAPrivateKey) {
        continue;
      }

      const valueStr = backedUpData[key];
      const parsedValue = JSON.parse(valueStr);

      let secretPhraseOrOldAndroidBackupPrivateKey: string | any; // TODO: Strengthen this type
      /*
       * Backups that were saved encrypted with PIN to the cloud need to be
       * decrypted with the backup PIN first, and then if we still need
       * to store them as encrypted,
       * we need to re-encrypt them with a new PIN
       */
      if (valueStr.includes('cipher')) {
        // eslint-disable-next-line no-await-in-loop
        secretPhraseOrOldAndroidBackupPrivateKey = await decryptSecretFromBackupPin({
          secret: valueStr,
          backupPIN,
        });

        if (
          theKeyIsAPrivateKey &&
          secretPhraseOrOldAndroidBackupPrivateKey &&
          typeof secretPhraseOrOldAndroidBackupPrivateKey.privateKey !== 'undefined'
        ) {
          secretPhraseOrOldAndroidBackupPrivateKey = secretPhraseOrOldAndroidBackupPrivateKey.privateKey;
        }

        if (
          theKeyIsASeedPhrase &&
          secretPhraseOrOldAndroidBackupPrivateKey &&
          typeof secretPhraseOrOldAndroidBackupPrivateKey.seedphrase !== 'undefined'
        ) {
          secretPhraseOrOldAndroidBackupPrivateKey = secretPhraseOrOldAndroidBackupPrivateKey.seedphrase;
        }
      } else if (theKeyIsASeedPhrase) {
        secretPhraseOrOldAndroidBackupPrivateKey = parsedValue.seedphrase;
      }

      if (!secretPhraseOrOldAndroidBackupPrivateKey) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      await createWallet({
        seed: secretPhraseOrOldAndroidBackupPrivateKey,
        isRestoring: true,
        overwrite: true,
        userPin,
      });
    }
    return true;
  } catch (e) {
    oldLogger.sentry('error in restoreSpecificBackupIntoKeychain');
    captureException(e);
    return false;
  }
}

async function restoreCurrentBackupIntoKeychain(backedUpData: BackedUpData, newPIN?: string): Promise<boolean> {
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
        const accessControl: typeof kc.publicAccessControlOptions =
          theKeyIsASeedPhrase || theKeyIsAPrivateKey ? privateAccessControlOptions : kc.publicAccessControlOptions;

        /*
         * Backups that were saved encrypted with PIN to the cloud need to be
         * decrypted with the backup PIN first, and then if we still need
         * to store them as encrypted,
         * we need to re-encrypt them with a new PIN
         */
        if (theKeyIsASeedPhrase) {
          const parsedValue = JSON.parse(value);
          parsedValue.seedphrase = await decryptSecretFromBackupPin({
            secret: parsedValue.seedphrase,
            backupPIN,
          });
          value = JSON.stringify(parsedValue);
        } else if (theKeyIsAPrivateKey) {
          const parsedValue = JSON.parse(value);
          parsedValue.privateKey = await decryptSecretFromBackupPin({
            secret: parsedValue.privateKey,
            backupPIN,
          });
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
          return kc.set(key, value, {
            ...accessControl,
            androidEncryptionPin: newPIN,
          });
        } else {
          return kc.setObject(key, value, {
            ...accessControl,
            androidEncryptionPin: newPIN,
          });
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

async function decryptSecretFromBackupPin({ secret, backupPIN }: { secret?: string; backupPIN?: string }) {
  let processedSecret = secret;

  if (!processedSecret) {
    return processedSecret;
  }

  /*
   * We need to decrypt the secret with the PIN stored in the backup
   * It is required for old backups created before we started storing
   * secrets in backups without PIN encryption
   */
  if (backupPIN && processedSecret.includes('cipher') && PIN_REGEX.test(backupPIN)) {
    const decryptedSecret = await encryptor.decrypt(backupPIN, processedSecret);

    if (decryptedSecret) {
      let decryptedSecretToUse = decryptedSecret;
      try {
        decryptedSecretToUse = JSON.parse(decryptedSecret);
      } catch (e) {
        // noop
      }
      processedSecret = decryptedSecretToUse;
    } else {
      logger.error(new RainbowError('Failed to decrypt backed up seed phrase using backup PIN.'));
      return processedSecret;
    }
  }

  return processedSecret;
}

// Attempts to save the password to decrypt the backup from the iCloud keychain
export async function saveBackupPassword(password: BackupPassword): Promise<void> {
  try {
    if (!IS_ANDROID) {
      await kc.setSharedWebCredentials('Backup Password', password);
      analytics.track('Saved backup password on iCloud');
    }
  } catch (e) {
    analytics.track("Didn't save backup password on iCloud");
  }
}

export async function getLocalBackupPassword(): Promise<string | null> {
  const rainbowBackupPassword = await keychain.loadString('RainbowBackupPassword');
  if (typeof rainbowBackupPassword === 'number') {
    return null;
  }

  if (rainbowBackupPassword) {
    return rainbowBackupPassword;
  }

  return await fetchBackupPassword();
}

export async function saveLocalBackupPassword(password: string) {
  const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();

  await keychain.saveString('RainbowBackupPassword', password, privateAccessControlOptions);
  saveBackupPassword(password);
}

// Attempts to fetch the password to decrypt the backup from the iCloud keychain
export async function fetchBackupPassword(): Promise<null | BackupPassword> {
  if (IS_ANDROID) {
    return null;
  }

  try {
    const { value: results } = await kc.getSharedWebCredentials();
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

export async function getDeviceUUID(): Promise<string | null> {
  if (IS_ANDROID) {
    return null;
  }

  return new Promise(resolve => {
    DeviceUUID.getUUID((error: unknown, uuid: string[]) => {
      if (error) {
        logger.error(new RainbowError('Received error when trying to get uuid from Native side'), {
          error,
        });
        resolve(null);
      } else {
        resolve(uuid[0]);
      }
    });
  });
}

const FailureAlert = () =>
  Alert({
    buttons: [
      {
        style: 'cancel',
        text: i18n.t(i18n.l.check_identifier.failure_alert.action),
      },
    ],
    message: i18n.t(i18n.l.check_identifier.failure_alert.message),
    title: i18n.t(i18n.l.check_identifier.failure_alert.title),
  });

/**
 * Checks if the identifier is the same as the one stored in localstorage
 * The identifier can get out of sync in two instances:
 * 1. when the user reinstalls the app
 * 2. when the user migrates phones (we really only care about this instance)
 *
 * The goal here is to not allow them into the app if they have broken keychain data from a phone migration
 *
 * @returns a promise function to be ran after successful biometric authentication
 */
export async function checkIdentifierOnLaunch() {
  // Unable to really persist things on Android, so let's just exit early...
  if (IS_ANDROID) return;

  const { idfa_check_enabled } = getRemoteConfig();
  if (!idfa_check_enabled || IS_DEV) {
    return;
  }

  try {
    const uuid = await getDeviceUUID();
    if (!uuid) {
      throw new Error('Unable to retrieve identifier for vendor');
    }

    const currentIdentifier = await kc.get(identifierForVendorKey);
    if (currentIdentifier.error) {
      switch (currentIdentifier.error) {
        case kc.ErrorType.Unavailable: {
          logger.debug('Value for current identifier not found, setting it to new UUID...', {
            uuid,
            error: currentIdentifier.error,
          });
          await kc.set(identifierForVendorKey, uuid);
          return;
        }

        default:
          logger.error(new RainbowError('Error while checking identifier on launch'), {
            error: currentIdentifier.error,
          });
          break;
      }

      throw new Error('Unable to retrieve current identifier');
    }

    // NOTE: This can only happen on a fresh install
    if (!currentIdentifier.value) {
      await kc.set(identifierForVendorKey, uuid);
      return;
    }

    if (currentIdentifier.value === uuid) {
      return;
    }

    return new Promise(resolve => {
      Navigation.handleAction(Routes.CHECK_IDENTIFIER_SCREEN, {
        step: walletBackupStepTypes.check_identifier,
        // NOTE: Just a reinstall, let's update the identifer and send them back to the app
        onSuccess: async () => {
          await kc.set(identifierForVendorKey, uuid);
          Navigation.goBack();
          resolve(true);
        },
        // NOTE: Detected a phone migration, let's remove keychain keys and send them back to the welcome screen
        onFailure: async () => {
          FailureAlert();
          // wipe keychain
          await kc.clear();

          // re-add the IDFA uuid
          await kc.set(identifierForVendorKey, uuid);

          // clear async storage
          await AsyncStorage.clear();

          // clear mmkv
          clearAllStorages();

          // send user back to welcome screen
          Navigation.handleAction(Routes.WELCOME_SCREEN, {});
          resolve(false);
        },
      });
    });
  } catch (error) {
    logger.error(new RainbowError('Error while checking identifier on launch'), {
      extra: {
        error,
      },
    });
  }

  return false;
}
