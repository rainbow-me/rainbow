import { sortBy } from 'lodash';
import RNCloudFs from 'react-native-cloud-fs';
import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';
import RNFS from 'react-native-fs';
import AesEncryptor from '../handlers/aesEncryption';
import { logger } from '../utils';
const REMOTE_BACKUP_WALLET_DIR = 'rainbow.me/wallet-backups';
const USERDATA_FILE = 'UserData.json';
const encryptor = new AesEncryptor();

export async function deleteAllBackups() {
  const backups = await RNCloudFs.listFiles({
    scope: 'hidden',
    targetPath: REMOTE_BACKUP_WALLET_DIR,
  });
  backups.files.forEach(async file => {
    await RNCloudFs.deleteFromCloud(file);
  });
}

export async function encryptAndSaveDataToCloud(data, password, filename) {
  // Encrypt the data
  const encryptedData = await encryptor.encrypt(password, JSON.stringify(data));
  try {
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
    logger.log('Error during encryptAndSaveDataToCloud', e);
    return false;
  }
}

// Gets the document
function getICloudDocumentUrl(url) {
  const parts = url.split('?');
  parts.splice(0, 1);
  let e = '?' + parts.join('?'),
    t,
    n = null,
    r = 0;
  if (e) {
    // eslint-disable-next-line babel/no-unused-expressions
    (n = {}), (e = e.substr(1)), (t = e.split('&'));
    for (let s = 0, o = t.length; s < o; s++) {
      let u = t[s];
      // eslint-disable-next-line babel/no-unused-expressions
      u.indexOf('=') !== -1
        ? ((u = u.match(/([^=]*)=(.*)/)), u.shift())
        : (u = [u]),
        u &&
          (u.length === 2
            ? ((u[1] = decodeURIComponent(u[1])), (n[u[0]] = u[1]))
            : u.length === 1 && (n[r++] = decodeURIComponent(u[0])));
    }
  }
  const { uk, f, u } = n;
  // eslint-disable-next-line no-template-curly-in-string
  return u.replace('${uk}', uk).replace('${f}', f);
}

export async function getDataFromCloud(backupPassword, filename = null) {
  try {
    const backups = await RNCloudFs.listFiles({
      scope: 'hidden',
      targetPath: REMOTE_BACKUP_WALLET_DIR,
    });
    if (!backups || !backups.files || !backups.files.length) {
      return null;
    }

    let document;
    if (filename) {
      document = backups.files.find(file => file.name === filename);
      if (!document) {
        logger.error('No backup found with that name!');
        return null;
      }
    } else {
      const sortedBackups = sortBy(backups.files, 'lastModified').reverse();
      document = sortedBackups[0];
    }
    const documentUri = getICloudDocumentUrl(document.uri);
    const response = await fetch(documentUri);
    const encryptedData = await response.text();

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
