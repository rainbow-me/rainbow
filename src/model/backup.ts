import { captureException } from '@sentry/react-native';
import { endsWith, forEach, map } from 'lodash';
import {
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
  publicAccessControlOptions,
  RainbowWallet,
} from './wallet';

import logger from 'logger';

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

  const allowedPkeysKeys = map(
    wallet?.addresses,
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
      allowedPkeysKeys.indexOf(item.username) === -1
    ) {
      return;
    }

    secrets[item.username] = item.password;
  });
  return secrets;
}

export async function backupWalletToCloud(
  password: BackupPassword,
  wallet: RainbowWallet
) {
  const now = Date.now();

  const secrets = await extractSecretsForWallet(wallet);
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

export function findLatestBackUp(wallets: AllRainbowWallets): string | null {
  let latestBackup: string | null = null;
  let filename: string | null = null;

  forEach(wallets, wallet => {
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

  return filename;
}

export async function restoreCloudBackup(
  password: BackupPassword,
  userData: BackupUserData
): Promise<boolean> {
  try {
    const filename = findLatestBackUp(userData?.wallets);

    if (!filename) {
      return false;
    }

    // 2- download that backup
    const data = await getDataFromCloud(password, filename);
    if (!data) {
      throw new Error('Invalid password');
    }

    // Restore only wallets that were backed up in cloud
    // or wallets that are read-only
    const walletsToRestore: AllRainbowWallets = {};
    forEach(userData.wallets, wallet => {
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

    const dataToRestore = {
      // All wallets
      [allWalletsKey]: {
        version: allWalletsVersion,
        wallets: walletsToRestore,
      },
      ...data.secrets,
    };

    return restoreBackupIntoKeychain(dataToRestore);
  } catch (e) {
    logger.sentry('Error while restoring back up');
    captureException(e);
    return false;
  }
}

async function restoreBackupIntoKeychain(
  backedUpData: BackedUpData
): Promise<boolean> {
  try {
    // Access control config per each type of key
    const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();

    await Promise.all(
      Object.keys(backedUpData).map(async key => {
        const value = backedUpData[key];
        let accessControl: Options = publicAccessControlOptions;
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
    }
  } catch (e) {
    logger.sentry('Error while backing up password');
    captureException(e);
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
