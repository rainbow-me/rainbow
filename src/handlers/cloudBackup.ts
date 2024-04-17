import { sortBy } from 'lodash';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RNCloudFs from 'react-native-cloud-fs';
import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';
import RNFS from 'react-native-fs';
import AesEncryptor from '../handlers/aesEncryption';
import { logger, RainbowError } from '@/logger';
import { IS_ANDROID, IS_IOS } from '@/env';
import { CloudBackups } from '@/model/backup';
const REMOTE_BACKUP_WALLET_DIR = 'rainbow.me/wallet-backups';
const USERDATA_FILE = 'UserData.json';
const encryptor = new AesEncryptor();

export const CLOUD_BACKUP_ERRORS = {
  ERROR_DECRYPTING_DATA: 'Error decrypting data',
  ERROR_GETTING_ENCRYPTED_DATA: 'Error getting encrypted data!',
  GENERAL_ERROR: 'Backup failed',
  INTEGRITY_CHECK_FAILED: 'Backup integrity check failed',
  KEYCHAIN_ACCESS_ERROR: `Couldn't read items from keychain`,
  NO_BACKUPS_FOUND: 'No backups found',
  SPECIFIC_BACKUP_NOT_FOUND: 'No backup found with that name',
  UKNOWN_ERROR: 'Unknown Error',
  WALLET_BACKUP_STATUS_UPDATE_FAILED: 'Update wallet backup status failed',
  MISSING_PIN: 'The PIN code you entered is invalid',
};

export function normalizeAndroidBackupFilename(filename: string) {
  return filename.replace(`${REMOTE_BACKUP_WALLET_DIR}/`, '');
}

export async function logoutFromGoogleDrive() {
  IS_ANDROID && RNCloudFs.logout();
}

export type GoogleDriveUserData = {
  name?: string;
  email?: string;
  avatarUrl?: string;
};

export async function getGoogleAccountUserData(): Promise<GoogleDriveUserData | undefined> {
  if (!IS_ANDROID) {
    return;
  }
  return RNCloudFs.getCurrentlySignedInUserData();
}

// This is used for dev purposes only!
export async function deleteAllBackups() {
  if (android) {
    await RNCloudFs.loginIfNeeded();
  }
  const backups = await RNCloudFs.listFiles({
    scope: 'hidden',
    targetPath: REMOTE_BACKUP_WALLET_DIR,
  });
  await Promise.all(
    backups.files.map(async (file: any) => {
      await RNCloudFs.deleteFromCloud(file);
    })
  );
}

export async function fetchAllBackups(): Promise<CloudBackups> {
  if (android) {
    await RNCloudFs.loginIfNeeded();
  }
  return RNCloudFs.listFiles({
    scope: 'hidden',
    targetPath: REMOTE_BACKUP_WALLET_DIR,
  });
}

export async function encryptAndSaveDataToCloud(data: any, password: any, filename: any) {
  // Encrypt the data
  try {
    const encryptedData = await encryptor.encrypt(password, JSON.stringify(data));

    /**
     * We need to normalize the filename on Android, because sometimes
     * the filename is returned with the path used for Google Drive storage.
     * That is with REMOTE_BACKUP_WALLET_DIR included.
     */
    const backupFilename = IS_ANDROID ? normalizeAndroidBackupFilename(filename) : filename;

    // Store it on the FS first
    const path = `${RNFS.DocumentDirectoryPath}/${backupFilename}`;
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | undefined' is not assig... Remove this comment to see the full error message
    await RNFS.writeFile(path, encryptedData, 'utf8');
    const sourceUri = { path };
    const destinationPath = `${REMOTE_BACKUP_WALLET_DIR}/${backupFilename}`;
    const mimeType = 'application/json';
    // Only available to our app
    const scope = 'hidden';
    if (IS_ANDROID) {
      await RNCloudFs.loginIfNeeded();
    }
    const result = await RNCloudFs.copyToCloud({
      mimeType,
      scope,
      sourcePath: sourceUri,
      targetPath: destinationPath,
    });
    // Now we need to verify the file has been stored in the cloud
    const exists = await RNCloudFs.fileExists(
      IS_IOS
        ? {
            scope,
            targetPath: destinationPath,
          }
        : {
            fileId: result,
            scope,
          }
    );

    if (!exists) {
      logger.info('Backup doesnt exist after completion');
      const error = new Error(CLOUD_BACKUP_ERRORS.INTEGRITY_CHECK_FAILED);
      logger.error(new RainbowError(error.message));
      throw error;
    }

    await RNFS.unlink(path);
    return filename;
  } catch (e: any) {
    logger.error(new RainbowError('Error during encryptAndSaveDataToCloud'), {
      message: e.message,
    });
    throw new Error(CLOUD_BACKUP_ERRORS.GENERAL_ERROR);
  }
}

function getICloudDocument(filename: any) {
  return RNCloudFs.getIcloudDocument(filename);
}

function getGoogleDriveDocument(id: any) {
  return RNCloudFs.getGoogleDriveDocument(id);
}

export function syncCloud() {
  if (ios) {
    return RNCloudFs.syncCloud();
  }
  return true;
}

export async function getDataFromCloud(backupPassword: any, filename: string | null = null) {
  if (IS_ANDROID) {
    await RNCloudFs.loginIfNeeded();
  }

  const backups = await RNCloudFs.listFiles({
    scope: 'hidden',
    targetPath: REMOTE_BACKUP_WALLET_DIR,
  });

  if (!backups || !backups.files || !backups.files.length) {
    const error = new Error(CLOUD_BACKUP_ERRORS.NO_BACKUPS_FOUND);
    throw error;
  }

  let document;
  if (filename) {
    if (IS_IOS) {
      // .icloud are files that were not yet synced
      document = backups.files.find((file: any) => file.name === filename || file.name === `.${filename}.icloud`);
    } else {
      document = backups.files.find((file: any) => {
        return file.name === `${REMOTE_BACKUP_WALLET_DIR}/${filename}` || file.name === filename;
      });
    }

    if (!document) {
      logger.error(new RainbowError('No backup found with that name!'), {
        filename,
      });
      const error = new Error(CLOUD_BACKUP_ERRORS.SPECIFIC_BACKUP_NOT_FOUND);
      throw error;
    }
  } else {
    const sortedBackups = sortBy(backups.files, 'lastModified').reverse();
    document = sortedBackups[0];
  }
  const encryptedData = ios ? await getICloudDocument(filename) : await getGoogleDriveDocument(document.id);

  if (encryptedData) {
    logger.info('Got cloud document ', { filename });
    const backedUpDataStringified = await encryptor.decrypt(backupPassword, encryptedData);
    if (backedUpDataStringified) {
      const backedUpData = JSON.parse(backedUpDataStringified);
      return backedUpData;
    } else {
      logger.error(new RainbowError('We couldnt decrypt the data'));
      const error = new Error(CLOUD_BACKUP_ERRORS.ERROR_DECRYPTING_DATA);
      throw error;
    }
  }

  logger.error(new RainbowError('We couldnt get the encrypted data'));
  const error = new Error(CLOUD_BACKUP_ERRORS.ERROR_GETTING_ENCRYPTED_DATA);
  throw error;
}

export async function backupUserDataIntoCloud(data: any) {
  const filename = USERDATA_FILE;
  const password = RAINBOW_MASTER_KEY;
  return encryptAndSaveDataToCloud(data, password, filename);
}

export async function fetchUserDataFromCloud() {
  const filename = USERDATA_FILE;
  const password = RAINBOW_MASTER_KEY;

  return getDataFromCloud(password, filename);
}

export const cloudBackupPasswordMinLength = 8;

export function isCloudBackupPasswordValid(password: any) {
  return !!(password && password !== '' && password.length >= cloudBackupPasswordMinLength);
}

export function isCloudBackupAvailable() {
  if (ios) {
    return RNCloudFs.isAvailable();
  }
  return true;
}

export async function login() {
  if (IS_ANDROID) {
    return RNCloudFs.loginIfNeeded();
  }

  return true;
}
