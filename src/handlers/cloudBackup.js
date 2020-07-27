import { sortBy } from 'lodash';
import { Platform } from 'react-native';
import RNCloudFs from 'react-native-cloud-fs';
import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';
import RNFS from 'react-native-fs';
import AesEncryptor from '../handlers/aesEncryption';
import { logger } from '../utils';
export const REMOTE_BACKUP_WALLET_DIR = 'rainbow.me/wallet-backups';
const USERDATA_FILE = 'UserData.json';
const encryptor = new AesEncryptor();

export async function deleteAllBackups() {
  try {
    await RNCloudFs.loginIfNeeded();
    const backups = await RNCloudFs.listFiles({
      scope: 'hidden',
      targetPath: REMOTE_BACKUP_WALLET_DIR,
    });
    backups.files.forEach(async file => {
      await RNCloudFs.deleteFromCloud(file);
    });
    return true;
  } catch (e) {
    logger.log('error while deleting all backups', e);
  }
}

export async function encryptAndSaveDataToCloud(data, password, filename) {
  // Encrypt the data
  console.log('[DEBUG]: encrypting data', data, password, filename);
  const encryptedData = await encryptor.encrypt(password, JSON.stringify(data));
  try {
    // Store it on the FS first
    const path = `${RNFS.DocumentDirectoryPath}/${filename}`;
    console.log('[DEBUG]: writing on FS', path);
    await RNFS.writeFile(path, encryptedData, 'utf8');
    console.log('[DEBUG]: done writing on FS', path);
    const sourceUri = { path };
    const destinationPath = `${REMOTE_BACKUP_WALLET_DIR}/${filename}`;
    const mimeType = 'application/json';
    // Only available to our app
    const scope = 'hidden';
    console.log('[DEBUG]: copying to cloud');
    console.log('[DEBUG]: Logging in if necessary');
    await RNCloudFs.loginIfNeeded();
    const result = await RNCloudFs.copyToCloud({
      mimeType,
      scope,
      sourcePath: sourceUri,
      targetPath: destinationPath,
    });
    console.log('[DEBUG]: done copying to cloud');
    // Now we need to verify the file has been stored in the cloud
    const exists = await RNCloudFs.fileExists(
      Platform.OS === 'ios'
        ? {
            scope,
            targetPath: destinationPath,
          }
        : {
            fileId: result,
            scope,
          }
    );
    console.log('[DEBUG]: exists', exists);
    if (!exists) {
      return false;
    }
    console.log('[DEBUG]: deleting local');
    await RNFS.unlink(path);
    console.log('[DEBUG]: done deleting local');
    return filename;
  } catch (e) {
    logger.log('Error during encryptAndSaveDataToCloud', e);
    return false;
  }
}

function getICloudDocument(filename) {
  return RNCloudFs.getIcloudDocument(filename);
}

function getGoogleDriveDocument(id) {
  return RNCloudFs.getGoogleDriveDocument(id);
}

export async function getDataFromCloud(backupPassword, filename = null) {
  try {
    if (Platform.OS === 'android') {
      await RNCloudFs.loginIfNeeded();
    }

    const backups = await RNCloudFs.listFiles({
      scope: 'hidden',
      targetPath: REMOTE_BACKUP_WALLET_DIR,
    });

    if (!backups || !backups.files || !backups.files.length) {
      return null;
    }

    let document;
    if (filename) {
      // .icloud are files that were not yet synced
      if (Platform.OS === 'ios') {
        document = backups.files.find(
          file => file.name === filename || file.name === `.${filename}.icloud`
        );
      } else {
        document = backups.files.find(file => {
          return file.name === `${REMOTE_BACKUP_WALLET_DIR}/${filename}`;
        });
      }
      if (!document) {
        logger.error('No backup found with that name!', filename);
        return null;
      }
    } else {
      const sortedBackups = sortBy(backups.files, 'lastModified').reverse();
      document = sortedBackups[0];
    }
    const encryptedData =
      Platform.OS === 'ios'
        ? await getICloudDocument(filename)
        : await getGoogleDriveDocument(document.id);

    if (encryptedData) {
      logger.prettyLog('Got cloud document ', filename);
    }
    const backedUpDataStringified = await encryptor.decrypt(
      backupPassword,
      encryptedData
    );
    if (backedUpDataStringified) {
      const backedUpData = JSON.parse(backedUpDataStringified);
      return backedUpData;
    }
    logger.log('We couldnt decrypt the data');
    return null;
  } catch (e) {
    logger.error(e);
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
