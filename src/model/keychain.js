import { captureException } from '@sentry/react-native';
import DeviceInfo from 'react-native-device-info';
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
import { logger } from '../utils';
const RAINBOW_BACKUP_KEY = 'rainbowBackup';

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

export async function restoreBackupIntoKeychain(backedUpData) {
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

  Object.keys(backedUpData).forEach(async key => {
    const value = backedUpData[key];
    let accessControl = publicAccessControlOptions;
    if (
      (key.indexOf('rainbowSeedPhrase') !== -1 ||
        key.indexOf('rainbowPrivateKey') !== -1) &&
      key !== 'rainbowSeedPhraseMigratedKey'
    ) {
      accessControl = privateAccessControlOptions;
    }
    if (typeof value === 'string') {
      await saveString(key, value, accessControl);
    } else {
      await saveObject(key, value, accessControl);
    }
  });

  return true;
}

// Attempts to save the password to decrypt the backup from the iCloud keychain
export async function saveBackupPassword(password) {
  try {
    await saveString(RAINBOW_BACKUP_KEY, password, {
      accessControl: ACCESS_CONTROL.USER_PRESENCE,
      accessible: ACCESSIBLE.WHEN_UNLOCKED,
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

  return results.password;
}

// For dev purposes only
export async function wipeKeychain() {
  const results = await loadAllKeys();
  results.forEach(async result => {
    await resetInternetCredentials(result.username);
  });
}
