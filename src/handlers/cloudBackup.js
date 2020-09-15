import { captureException } from '@sentry/react-native';
import { sortBy } from 'lodash';
import { Platform } from 'react-native';
import RNCloudFs from 'react-native-cloud-fs';
import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';
import RNFS from 'react-native-fs';
import AesEncryptor from '../handlers/aesEncryption';
import { logger } from '../utils';
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
};

// This is used for dev purposes only!
export async function deleteAllBackups() {
  const backups = await RNCloudFs.listFiles({
    scope: 'hidden',
    targetPath: REMOTE_BACKUP_WALLET_DIR,
  });
  await Promise.all(
    backups.files.map(async file => {
      await RNCloudFs.deleteFromCloud(file);
    })
  );
}

export async function encryptAndSaveDataToCloud(data, password, filename) {
  // Encrypt the data
  try {
    const encryptedData = await encryptor.encrypt(
      password,
      JSON.stringify(data)
    );
    // Store it on the FS first
    const path = `${RNFS.DocumentDirectoryPath}/${filename}`;
    await RNFS.writeFile(path, encryptedData, 'utf8');
    const sourceUri = { path };
    const destinationPath = `${REMOTE_BACKUP_WALLET_DIR}/${filename}`;
    const mimeType = 'application/json';
    // Only available to our app
    const scope = 'hidden';
    await RNCloudFs.copyToCloud({
      mimeType,
      scope,
      sourcePath: sourceUri,
      targetPath: destinationPath,
    });
    // Now we need to verify the file has been stored in the cloud
    const exists = await RNCloudFs.fileExists({
      scope,
      targetPath: destinationPath,
    });

    if (!exists) {
      logger.sentry('Backup doesnt exist after completion');
      const error = new Error(CLOUD_BACKUP_ERRORS.INTEGRITY_CHECK_FAILED);
      captureException(error);
      throw error;
    }

    await RNFS.unlink(path);
    return filename;
  } catch (e) {
    logger.sentry('Error during encryptAndSaveDataToCloud');
    captureException(e);
    throw new Error(CLOUD_BACKUP_ERRORS.GENERAL_ERROR);
  }
}

export async function getDataFromCloud(backupPassword, filename = null) {
  const backups = await RNCloudFs.listFiles({
    scope: 'hidden',
    targetPath: REMOTE_BACKUP_WALLET_DIR,
  });

  if (!backups || !backups.files || !backups.files.length) {
    logger.sentry('No backups found');
    const error = new Error(CLOUD_BACKUP_ERRORS.NO_BACKUPS_FOUND);
    captureException(error);
    throw error;
  }

  let document;
  if (filename) {
    // .icloud are files that were not yet synced
    document = backups.files.find(
      file => file.name === filename || file.name === `.${filename}.icloud`
    );
    if (!document) {
      logger.sentry('No backup found with that name!', filename);
      const error = new Error(CLOUD_BACKUP_ERRORS.SPECIFIC_BACKUP_NOT_FOUND);
      captureException(error);
      throw error;
    }
  } else {
    const sortedBackups = sortBy(backups.files, 'lastModified').reverse();
    document = sortedBackups[0];
  }
  const encryptedData = await RNCloudFs.getIcloudDocument(filename);
  if (encryptedData) {
    logger.sentry('Got getICloudDocument ', filename);
    const backedUpDataStringified = await encryptor.decrypt(
      backupPassword,
      encryptedData
    );
    if (backedUpDataStringified) {
      const backedUpData = JSON.parse(backedUpDataStringified);
      return backedUpData;
    } else {
      logger.sentry('We couldnt decrypt the data');
      const error = new Error(CLOUD_BACKUP_ERRORS.ERROR_DECRYPTING_DATA);
      captureException(error);
      throw error;
    }
  }
  logger.sentry('We couldnt get the encrypted data');
  const error = new Error(CLOUD_BACKUP_ERRORS.ERROR_GETTING_ENCRYPTED_DATA);
  captureException(error);
  throw error;
}

export async function backupUserDataIntoCloud(data) {
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

export function isCloudBackupPasswordValid(password) {
  return !!(
    password &&
    password !== '' &&
    password.length >= cloudBackupPasswordMinLength
  );
}

export function isCloudBackupAvailable() {
  if (Platform.OS === 'ios') {
    return RNCloudFs.isAvailable();
  }
  return false;
}
