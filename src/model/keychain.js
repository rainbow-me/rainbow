import { captureException } from '@sentry/react-native';
import {
  getInternetCredentials,
  resetInternetCredentials,
  setInternetCredentials,
} from 'react-native-keychain';
import { logger } from '../utils';

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

export async function saveObject(key, value, accessControlOptions) {
  const jsonValue = JSON.stringify(value);
  await saveString(key, jsonValue, accessControlOptions);
}

export async function loadObject(key) {
  const jsonValue = await loadString(key);
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
