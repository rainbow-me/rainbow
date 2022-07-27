import analytics from '@segment/analytics-react-native';
import { captureException, captureMessage } from '@sentry/react-native';
import DeviceInfo from 'react-native-device-info';
// @ts-expect-error
import { IS_TESTING } from 'react-native-dotenv';
import {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  canImplyAuthentication,
  getAllInternetCredentials,
  getInternetCredentials,
  getSupportedBiometryType,
  hasInternetCredentials,
  Options,
  resetInternetCredentials,
  Result,
  setInternetCredentials,
  UserCredentials,
} from 'react-native-keychain';
import { delay, getKeyByValue } from '../helpers/utilities';
import logger from 'logger';

export const keychainErrKey = {
  KEYCHAIN_ALLOCATE: 'Failed to allocate memory.',
  KEYCHAIN_AUTH_FAILED:
    'The user name or passphrase you entered is not correct.',
  KEYCHAIN_BAD_REQ: 'Bad parameter or invalid state for operation.',
  KEYCHAIN_CANCEL: 'Cancel',
  KEYCHAIN_DECODE: 'Unable to decode the provided data.',
  KEYCHAIN_DUPLICATE_ITEM: 'The specified item already exists in the keychain.',
  KEYCHAIN_ERROR_AUTHENTICATING: 'Error authenticating', //keychain cell was created with Face and user try to read with PIN, android only
  KEYCHAIN_FACE_UNLOCK_CANCEL: 'Face Unlock canceled by user',
  KEYCHAIN_INTERACTION_NOT_ALLOWED: 'User interaction is not allowed.',
  KEYCHAIN_IO: 'I/O error.',
  KEYCHAIN_ITEM_NOT_FOUND:
    'The specified item could not be found in the keychain.',
  KEYCHAIN_MISSING_ENTITLEMENTS:
    "Internal error when a required entitlement isn't present.",
  KEYCHAIN_NOT_AUTHENTICATED: 'Wrapped error: User not authenticated',
  KEYCHAIN_NOT_AVAILABLE:
    'No keychain is available. You may need to restart your computer.',
  KEYCHAIN_OP_WR: 'File already open with with write permission.',
  KEYCHAIN_PARAM:
    'One or more parameters passed to a function where not valid.',
  KEYCHAIN_UNIMPLEMENTED: 'Function or operation not implemented.',
  KEYCHAIN_USER_CANCELED: 'User canceled the operation.',
};

export async function saveString(
  key: string,
  value: string,
  accessControlOptions: Options
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      await setInternetCredentials(key, key, value, accessControlOptions);
      logger.sentry(`Keychain: saved string for key: ${key}`);
      resolve();
    } catch (e) {
      logger.sentry(`Keychain: failed to save string for key: ${key}`, e);
      captureMessage('Keychain write first attempt failed');
      await delay(1000);
      try {
        let acOptions = accessControlOptions;
        // This is a bug on iOS 14 and 15 simulators
        // See https://github.com/oblador/react-native-keychain/issues/509
        if (IS_TESTING === 'true') {
          acOptions.accessControl = undefined;
        }
        await setInternetCredentials(key, key, value, acOptions);
        logger.sentry(
          `Keychain: saved string for key: ${key} on second attempt`
        );
        resolve();
      } catch (e) {
        logger.sentry(`Keychain: failed to save string for key: ${key}`, e);
        captureMessage('Keychain write second attempt failed');
        reject(e);
      }
    }
  });
}

export async function loadString(
  key: string,
  options?: Options,
  isErrorBubbling = false
): Promise<null | string> {
  try {
    const credentials = await getInternetCredentials(key, options);

    if (credentials) {
      logger.log(`Keychain: loaded string for key: ${key}`);
      return credentials.password;
    }
    logger.sentry(`Keychain: string does not exist for key: ${key}`);
    return null;
  } catch (err: any) {
    const errMsg = err?.message.split('msg: ')[1];
    const errCode = getKeyByValue(keychainErrKey, errMsg || err?.message);

    if (errCode === keychainErrKey.KEYCHAIN_AUTH_FAILED) {
      // Try reading from keychain once more
      captureMessage('Keychain read first attempt failed');
      await delay(1000);
      try {
        const credentials = await getInternetCredentials(key, options);
        if (credentials) {
          logger.log(
            `Keychain: loaded string for key on second attempt: ${key}`
          );
          return credentials.password;
        }
        logger.sentry(`Keychain: string does not exist for key: ${key}`);
      } catch (e) {
        captureMessage('Keychain read second attempt failed');
        logger.sentry(
          `Keychain: failed to load string for key: ${key} error: ${err}`
        );
        captureException(err);
        analytics.track('Error on getting credentials from keychain', {
          error: err,
        });

        if (!isErrorBubbling) return null;
        throw e;
      }
    }
    logger.sentry(
      `Keychain: failed to load string for key: ${key} error: ${err}`
    );
    captureException(err);
    if (!isErrorBubbling) return null;
    throw errCode || err;
  }
}

export async function saveObject(
  key: string,
  value: Object,
  accessControlOptions: Options
): Promise<void> {
  const jsonValue = JSON.stringify(value);
  return saveString(key, jsonValue, accessControlOptions);
}

export async function loadObject(
  key: string,
  options?: Options
): Promise<null | Object> {
  try {
    const jsonValue = await loadString(key, options, true);
    if (!jsonValue) return null;

    const objectValue = JSON.parse(jsonValue);
    logger.log(`Keychain: parsed object for key: ${key}`);
    return objectValue;
  } catch (err) {
    logger.sentry(
      `Keychain: failed to parse object for key: ${key} error: ${err}`
    );
    captureException(err);
    throw err;
  }
}

export async function remove(key: string): Promise<void> {
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

export async function loadAllKeys(): Promise<null | UserCredentials[]> {
  try {
    const response = await getAllInternetCredentials();
    if (response) {
      return response.results;
    }

    return null;
  } catch (err: any) {
    const errMsg = err?.message.split('msg: ')[1];
    const errCode = getKeyByValue(keychainErrKey, errMsg || err?.message);
    logger.sentry(`Keychain: failed to loadAllKeys error: ${err}`);
    captureException(err);
    throw errCode;
  }
}

export async function hasKey(key: string): Promise<boolean | Result> {
  try {
    const result = await hasInternetCredentials(key);
    return result;
  } catch (err) {
    logger.sentry(
      `Keychain: failed to check if key ${key} exists -  error: ${err}`
    );
    captureException(err);
  }
  return false;
}

export async function wipeKeychain(): Promise<void> {
  try {
    const results = await loadAllKeys();
    if (results) {
      await Promise.all(
        results?.map(result => resetInternetCredentials(result.username))
      );
      logger.log('keychain wiped!');
    }
  } catch (e) {
    logger.sentry('error while wiping keychain');
    captureException(e);
    throw e;
  }
}

export const publicAccessControlOptions = {
  accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function getPrivateAccessControlOptions(): Promise<Options> {
  let res = {};
  try {
    let canAuthenticate;

    if (ios) {
      canAuthenticate = await canImplyAuthentication({
        authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
      });
    } else {
      const hasBiometricsEnabled = await getSupportedBiometryType();
      canAuthenticate = !!hasBiometricsEnabled;
    }

    let isSimulator = false;

    if (canAuthenticate) {
      isSimulator = __DEV__ && (await DeviceInfo.isEmulator());
    }
    if (canAuthenticate && !isSimulator) {
      res = {
        accessControl: ios
          ? ACCESS_CONTROL.USER_PRESENCE
          : ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
        accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      };
    }
    // eslint-disable-next-line no-empty
  } catch (e) {}

  return res;
}
