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

export async function backupToIcloud() {
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
  try {
    await saveString(RAINBOW_BACKUP_KEY, backup, {
      ACCESSIBLE: ACCESSIBLE.WHEN_UNLOCKED,
      synchronizable: true,
    });
  } catch (e) {
    logger.log('Error while backing up', e);
  }
}

export async function restoreIcloudBackup() {
  const results = await getInternetCredentials(RAINBOW_BACKUP_KEY, {
    synchronizable: true,
  });

  const backedUpData = JSON.parse(results.password);
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

  return results;
}

export async function reset() {
  const results = await loadAllKeys();
  results.forEach(async result => {
    await resetInternetCredentials(result.username);
  });
}
