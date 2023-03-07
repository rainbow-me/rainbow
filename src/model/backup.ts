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
} from '../handlers/cloudBackup';
import WalletBackupTypes from '../helpers/walletBackupTypes';
import WalletTypes from '../helpers/walletTypes';
import {
  allWalletsKey,
  privateKeyKey,
  seedPhraseKey,
  selectedWalletKey,
} from '../utils/keychainConstants';
import * as keychain from './keychain';
import {
  AllRainbowWallets,
  allWalletsVersion,
  createWallet,
  RainbowWallet,
} from './wallet';
import { analytics } from '@/analytics';
import logger from '@/utils/logger';
import { IS_ANDROID } from '@/env';
import AesEncryptor from '../handlers/aesEncryption';

const encryptor = new AesEncryptor();

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

  // We need to decrypt PIN code encrypted secrets before backup
  const hasBiometricsEnabled = await getSupportedBiometryType();
  if (IS_ANDROID && !hasBiometricsEnabled) {
    /**
     * Pin is passed and authentication is handled by the caller.
     * If we don't have a PIN, we throw an error both for the developer
     * and the user if something goes wrong.
     */
    if (userPIN === undefined) {
      throw new Error(CLOUD_BACKUP_ERRORS.MISSING_PIN);
    }
    let privateKey: string;

    // We go through each secret here and try to decrypt it if it's needed
    await Promise.all(
      Object.keys(secrets).map(async key => {
        const secret = secrets[key];

        if (key.endsWith(seedPhraseKey)) {
          const parsedSecret = JSON.parse(secret);
          const seedphrase = parsedSecret.seedphrase;

          if (userPIN && seedphrase && seedphrase?.includes('cipher')) {
            privateKey = await encryptor.decrypt(userPIN, seedphrase);
          }

          secrets[key] = JSON.stringify({
            ...parsedSecret,
            seedphrase: privateKey,
          });
        }
      })
    );
  }

  const data = {
    createdAt: now,
    secrets,
  };
  return encryptAndSaveDataToCloud(data, password, `backup_${now}.json`);
}

export async function addWalletToCloudBackup(
  password: BackupPassword,
  wallet: RainbowWallet,
  filename: string
): Promise<null | boolean> {
  // @ts-ignore
  const backup = await getDataFromCloud(password, filename);

  const now = Date.now();

  const secrets = await extractSecretsForWallet(wallet);

  backup.updatedAt = now;
  // Merge existing secrets with the ones from this wallet
  backup.secrets = {
    ...backup.secrets,
    ...secrets,
  };
  return encryptAndSaveDataToCloud(backup, password, filename);
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

export async function restoreCloudBackup(
  password: BackupPassword,
  userData: BackupUserData | null,
  backupSelected: string | null
): Promise<boolean> {
  // We support two flows
  // Restoring from the welcome screen, which uses the userData to rebuild the wallet
  // Restoring a specific backup from settings => Backup, which uses only the keys stored.

  try {
    const filename =
      backupSelected || (userData && findLatestBackUp(userData?.wallets));
    if (!filename) {
      return false;
    }
    // 2- download that backup
    // @ts-ignore
    const data = await getDataFromCloud(password, filename);
    if (!data) {
      throw new Error('Invalid password');
    }
    const dataToRestore = {
      ...data.secrets,
    };

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
      return restoreCurrentBackupIntoKeychain(dataToRestore);
    } else {
      return restoreSpecificBackupIntoKeychain(dataToRestore);
    }
  } catch (e) {
    logger.sentry('Error while restoring back up');
    captureException(e);
    return false;
  }
}

async function restoreSpecificBackupIntoKeychain(
  backedUpData: BackedUpData
): Promise<boolean> {
  try {
    // Re-import all the seeds (and / or pkeys) one by one
    for (const key of Object.keys(backedUpData)) {
      if (endsWith(key, seedPhraseKey)) {
        const valueStr = backedUpData[key];
        const { seedphrase } = JSON.parse(valueStr);
        await createWallet(seedphrase, null, null, true);
      }
    }
    return true;
  } catch (e) {
    logger.sentry('error in restoreSpecificBackupIntoKeychain');
    captureException(e);
    return false;
  }
}

async function restoreCurrentBackupIntoKeychain(
  backedUpData: BackedUpData
): Promise<boolean> {
  try {
    // Access control config per each type of key
    const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();

    await Promise.all(
      Object.keys(backedUpData).map(async key => {
        const value = backedUpData[key];
        let accessControl: Options = keychain.publicAccessControlOptions;
        if (endsWith(key, seedPhraseKey) || endsWith(key, privateKeyKey)) {
          accessControl = privateAccessControlOptions;
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
    logger.sentry('error in restoreBackupIntoKeychain');
    captureException(e);
    return false;
  }
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
    logger.sentry('Error while fetching backup password', e);
    captureException(e);
    return null;
  }
}
