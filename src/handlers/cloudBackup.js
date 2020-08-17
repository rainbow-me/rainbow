import { captureException } from '@sentry/react-native';
import { sortBy } from 'lodash';
import RNCloudFs from 'react-native-cloud-fs';
import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';
import RNFS from 'react-native-fs';
import AesEncryptor from '../handlers/aesEncryption';
import { logger } from '../utils';
const REMOTE_BACKUP_WALLET_DIR = 'rainbow.me/wallet-backups';
const USERDATA_FILE = 'UserData.json';
const encryptor = new AesEncryptor();

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
      return false;
    }

    await RNFS.unlink(path);
    return filename;
  } catch (e) {
    logger.sentry('Error during encryptAndSaveDataToCloud');
    captureException(e);
    return false;
  }
}

export async function getDataFromCloud(backupPassword, filename = null) {
  try {
    const backups = await RNCloudFs.listFiles({
      scope: 'hidden',
      targetPath: REMOTE_BACKUP_WALLET_DIR,
    });

    if (!backups || !backups.files || !backups.files.length) {
      logger.sentry('No backups found');
      return null;
    }

    let document;
    if (filename) {
      // .icloud are files that were not yet synced
      document = backups.files.find(
        file => file.name === filename || file.name === `.${filename}.icloud`
      );
      if (!document) {
        logger.sentry('No backup found with that name!', filename);
        captureException(new Error('No backup found with that name'));
        return null;
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
        captureException(new Error('Error decrypting data!'));
      }
    }
    logger.sentry('We couldnt get the encrypted data');
    captureException(new Error('Error getting encrypted data!'));
    return null;
  } catch (e) {
    logger.sentry('Error at getDataFromCloud');
    captureException(e);
    return null;
  }
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

export function isCloudBackupPasswordValid(password) {
  return !!(password && password !== '' && password.length >= 8);
}
