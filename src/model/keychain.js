import { captureException } from '@sentry/react-native';
import { sortBy } from 'lodash';
import RNCloudFs from 'react-native-cloud-fs';
import DeviceInfo from 'react-native-device-info';
import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';
import RNFS from 'react-native-fs';
import {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  canImplyAuthentication,
  getAllInternetCredentials,
  getInternetCredentials,
  resetInternetCredentials,
  setInternetCredentials,
} from 'react-native-keychain';
import AesEncryptor from '../handlers/aesEncryption';
import { logger } from '../utils';
const REMOTE_BACKUP_WALLET_DIR = 'rainbow.me/wallet-backups';
const RAINBOW_BACKUP_KEY = 'rainbowBackup';
const encryptor = new AesEncryptor();

// NOTE: implement access control for iOS keychain
export async function saveString(key, value, accessControlOptions) {
  try {
    await setInternetCredentials(key, key, value, accessControlOptions);
    logger.log(`Keychain: saved string for key: ${key}`);
  } catch (err) {
    logger.log(`Keychain: failed to save string for key: ${key} error: ${err}`);
    captureException(err);
  }
}

export async function loadString(key, authenticationPrompt) {
  try {
    const credentials = await getInternetCredentials(key, authenticationPrompt);
    if (credentials) {
      logger.log(`Keychain: loaded string for key: ${key}`);
      return credentials.password;
    }
    logger.log(`Keychain: string does not exist for key: ${key}`);
  } catch (err) {
    logger.log(`Keychain: failed to load string for key: ${key} error: ${err}`);
    captureException(err);
  }
  return null;
}

export async function loadAllKeys(authenticationPrompt) {
  try {
    const { results } = await getAllInternetCredentials(authenticationPrompt);
    return results;
  } catch (err) {
    logger.log(`Keychain: failed to load all items`, err);
    captureException(err);
  }
  return null;
}

export async function saveObject(key, value, accessControlOptions) {
  const jsonValue = JSON.stringify(value);
  await saveString(key, jsonValue, accessControlOptions);
}

export async function loadObject(key, authenticationPrompt) {
  const jsonValue = await loadString(key, authenticationPrompt);
  try {
    const objectValue = JSON.parse(jsonValue);
    logger.log(`Keychain: parsed object for key: ${key}`);
    return objectValue;
  } catch (err) {
    logger.log(
      `Keychain: failed to parse object for key: ${key} error: ${err}`
    );
    captureException(err);
  }
  return null;
}

export async function remove(key) {
  try {
    await resetInternetCredentials(key);
    logger.log(`Keychain: removed value for key: ${key}`);
  } catch (err) {
    logger.log(
      `Keychain: failed to remove value for key: ${key} error: ${err}`
    );
    captureException(err);
  }
}

export async function backupToCloud(password) {
  const results = await loadAllKeys();
  const parsedResults = results.map(result => {
    let password = result.password;
    try {
      password = JSON.parse(password);
      // eslint-disable-next-line no-empty
    } catch (e) {}
    return {
      ...result,
      password,
    };
  });

  const backup = JSON.stringify(parsedResults);
  const encryptedBackup = await encryptor.encrypt(password, backup);
  try {
    const ts = new Date().getTime();
    const filename = `wallet_${ts}.json`;
    const path = `${RNFS.DocumentDirectoryPath}/${filename}`;
    await RNFS.writeFile(path, encryptedBackup, 'utf8');
    const sourceUri = { path };
    const destinationPath = `${REMOTE_BACKUP_WALLET_DIR}/${filename}`;
    const mimeType = 'application/json';
    const scope = 'hidden';
    await RNCloudFs.copyToCloud({
      mimeType,
      scope,
      sourcePath: sourceUri,
      targetPath: destinationPath,
    });
    // Now we need to verify the file has been stored
    const exists = await RNCloudFs.fileExists({
      scope,
      targetPath: destinationPath,
    });
    if (!exists) {
      return;
    }
    await RNFS.unlink(path);
    return true;
  } catch (e) {
    logger.log('Error while backing up', e);
  }
}

export async function restoreCloudBackup(backupPassword) {
  try {
    const backups = await RNCloudFs.listFiles({
      scope: 'hidden',
      targetPath: REMOTE_BACKUP_WALLET_DIR,
    });
    if (!backups || !backups.files || !backups.files.length) {
      return;
    }

    const sortedBackups = sortBy(backups.files, 'lastModified').reverse();

    console.log('sorted backups', sortedBackups);

    const lastBackup = sortedBackups[0];
    const documentUri = getICloudDocumentUrl(lastBackup.uri);
    const response = await fetch(documentUri);
    const encryptedBackedUpData = await response.text();

    const backedUpDataStringified = await encryptor.decrypt(
      backupPassword,
      encryptedBackedUpData
    );

    const backedUpData = JSON.parse(backedUpDataStringified);

    // Access control config per each type of key
    const publicAccessControlOptions = {
      accessible: ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
    };

    let privateAccessControlOptions = {};
    const canAuthenticate = await canImplyAuthentication({
      authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
    });

    let isSimulator = false;

    if (canAuthenticate) {
      isSimulator = __DEV__ && (await DeviceInfo.isEmulator());
    }
    if (canAuthenticate && !isSimulator) {
      privateAccessControlOptions = {
        accessControl: ACCESS_CONTROL.USER_PRESENCE,
        accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      };
    }

    backedUpData.forEach(async item => {
      let accessControl = publicAccessControlOptions;
      if (
        (item.username.indexOf('rainbowSeedPhrase') !== -1 ||
          item.username.indexOf('rainbowPrivateKey') !== -1) &&
        item.username !== 'rainbowSeedPhraseMigratedKey'
      ) {
        accessControl = privateAccessControlOptions;
      }
      if (typeof item.password === 'string') {
        await saveString(item.username, item.password, accessControl);
      } else {
        await saveObject(item.username, item.password, accessControl);
      }
    });

    return true;
  } catch (e) {
    logger.log('Error while trying to import cloud backup', e);
    return false;
  }
}

// Attempts to fetch the password to decrypt the backup from the iCloud keychain
export async function saveBackupPassword(password) {
  const encryptedPassword = await encryptor.encrypt(
    RAINBOW_MASTER_KEY,
    password
  );
  try {
    await saveString(RAINBOW_BACKUP_KEY, encryptedPassword, {
      ACCESSIBLE: ACCESSIBLE.WHEN_UNLOCKED,
      synchronizable: true,
    });
  } catch (e) {
    logger.log('Error while backing up password', e);
  }
}

// Attempts to fetch the password to decrypt the backup from the iCloud keychain
export async function fetchBackupPassword() {
  const results = await getInternetCredentials(RAINBOW_BACKUP_KEY, {
    synchronizable: true,
  });

  const encryptedPassword = results.password;
  await encryptor.decrypt(RAINBOW_MASTER_KEY, encryptedPassword);
}

// For dev purposes only
export async function reset() {
  const results = await loadAllKeys();
  results.forEach(async result => {
    await resetInternetCredentials(result.username);
  });
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
