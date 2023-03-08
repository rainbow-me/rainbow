import isNil from 'lodash/isNil';
import DeviceInfo from 'react-native-device-info';
import { IS_TESTING } from 'react-native-dotenv';
import {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  canImplyAuthentication,
  getAllInternetCredentials,
  getAllInternetCredentialsKeys,
  getInternetCredentials,
  getSupportedBiometryType,
  hasInternetCredentials,
  Options,
  resetInternetCredentials,
  Result,
  setInternetCredentials,
  UserCredentials,
} from 'react-native-keychain';
import { delay } from '../helpers/utilities';
import { logger, RainbowError } from '@/logger';
import { MMKV } from 'react-native-mmkv';

const keychainLocalStorage = new MMKV({
  id: 'rainbowKeychainLocalStorage',
});

interface AnonymousKey {
  length: number;
  nil: boolean;
  type: string;
}

interface AnonymousKeyData {
  [key: string]: AnonymousKey;
}

const saveStringMMKV = (key: string, value: string) => {
  keychainLocalStorage.set(key, value);
};

const loadStringMMKV = (key: string) => {
  return keychainLocalStorage.getString(key);
};

export async function saveString(
  key: string,
  value: string,
  accessControlOptions: Options
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // only say public data to mmkv
      // private data has accessControl
      if (!accessControlOptions?.accessControl) {
        saveStringMMKV(key, value);
      }

      // save to keychain
      await setInternetCredentials(key, key, value, accessControlOptions);
      logger.info(`Keychain: saved string for key: ${key}`);
      resolve();
    } catch (e) {
      logger.warn(
        `Keychain: first attempt failed to save string for key: ${key}`
      );
      await delay(1000);
      try {
        let acOptions = accessControlOptions;
        // This is a bug on iOS 14 and 15 simulators
        // See https://github.com/oblador/react-native-keychain/issues/509
        if (IS_TESTING === 'true') {
          acOptions.accessControl = undefined;
        }
        await setInternetCredentials(key, key, value, acOptions);
        logger.info(`Keychain: saved string for key: ${key} on second attempt`);
        resolve();
      } catch (e) {
        logger.error(
          new RainbowError(`Keychain: failed to save string for key: ${key}`)
        );
        reject(e);
      }
    }
  });
}

export async function loadString(
  key: string,
  options?: Options
): Promise<null | string | -1 | -2> {
  try {
    // try to load data from mmkv first
    // if its private or does not exist, it will return undefined
    const data = loadStringMMKV(key);
    if (data) {
      return data;
    }

    // load from keychain if not found in MMKV (private or does not exist)
    const credentials = await getInternetCredentials(key, options);
    if (credentials) {
      logger.info(`Keychain: loaded string for key: ${key}`);
      return credentials.password;
    }
    logger.error(
      new RainbowError(`Keychain: string does not exist for key: ${key}`)
    );
  } catch (err: any) {
    if (err.toString() === 'Error: User canceled the operation.') {
      logger.warn(`Keychain: user canceled the operation`);
      return -1;
    }
    if (err.toString() === 'Error: Wrapped error: User not authenticated') {
      logger.warn(`Keychain: user not authenticated`);
      return -2;
    }
    if (
      err.toString() ===
      'Error: The user name or passphrase you entered is not correct.'
    ) {
      logger.warn('Keychain read first attempt failed');
      await delay(1000);
      try {
        const credentials = await getInternetCredentials(key, options);
        if (credentials) {
          logger.info(
            `Keychain: loaded string for key on second attempt: ${key}`
          );
          return credentials.password;
        }
        logger.error(
          new RainbowError(`Keychain: string does not exist for key: ${key}`)
        );
      } catch (e) {
        if (err.toString() === 'Error: User canceled the operation.') {
          logger.warn(`Keychain: user canceled the operation`);
          return -1;
        }
        if (err.toString() === 'Error: Wrapped error: User not authenticated') {
          logger.warn(`Keychain: user not authenticated`);
          return -2;
        }
        logger.error(
          new RainbowError(
            `Keychain: failed to load string for key: ${key} error: ${err}`
          )
        );
      }
      return null;
    }
    logger.error(
      new RainbowError(
        `Keychain: failed to load string for key: ${key} error: ${err}`
      )
    );
  }
  return null;
}

export async function saveObject(
  key: string,
  value: Record<string, unknown>,
  accessControlOptions: Options
): Promise<void> {
  const jsonValue = JSON.stringify(value);

  // only say public data to mmkv
  // private data has accessControl
  if (!accessControlOptions?.accessControl) {
    saveStringMMKV(key, jsonValue);
  }
  // save to keychain
  return saveString(key, jsonValue, accessControlOptions);
}

export async function loadObject(
  key: string,
  options?: Options
): Promise<null | Record<string, any> | -1 | -2> {
  // try to load data from mmkv first
  // if its private or does not exist, it will return undefined
  const jsonValueMMKV = loadStringMMKV(key);

  if (jsonValueMMKV) {
    try {
      const objectValue = JSON.parse(jsonValueMMKV);
      return objectValue;
    } catch (err) {
      logger.error(
        new RainbowError(
          `Keychain MMKV: failed to parse object for key: ${key} error: ${err}`
        )
      );
    }
  }

  // load from keychain if not found in MMKV (private or does not exist)
  const jsonValue = await loadString(key, options);
  if (!jsonValue) return null;
  if (jsonValue === -1 || jsonValue === -2) {
    return jsonValue;
  }
  try {
    const objectValue = JSON.parse(jsonValue);
    logger.info(`Keychain: parsed object for key: ${key}`);
    return objectValue;
  } catch (err) {
    logger.error(
      new RainbowError(
        `Keychain: failed to parse object for key: ${key} error: ${err}`
      )
    );
  }
  return null;
}

export async function remove(key: string): Promise<void> {
  try {
    // remove from MMKV
    keychainLocalStorage.delete(key);

    // remove from keychain
    await resetInternetCredentials(key);
    logger.info(`Keychain: removed value for key: ${key}`);
  } catch (err) {
    logger.error(
      new RainbowError(
        `Keychain: failed to remove value for key: ${key} error: ${err}`
      )
    );
  }
}

export async function loadAllKeys(): Promise<null | UserCredentials[]> {
  try {
    const response = await getAllInternetCredentials();
    if (response) {
      return response.results;
    }
  } catch (err) {
    logger.error(
      new RainbowError(`Keychain: failed to loadAllKeys error: ${err}`)
    );
  }
  return null;
}

export async function getAllKeysAnonymized(): Promise<null | AnonymousKeyData> {
  const data: AnonymousKeyData = {};
  const results = await loadAllKeys();
  results?.forEach(result => {
    data[result?.username] = {
      length: result?.password?.length,
      nil: isNil(result?.password),
      type: typeof result?.password,
    };
  });
  return data;
}

export async function loadAllKeysOnly(): Promise<null | string[]> {
  try {
    const response = await getAllInternetCredentialsKeys();
    if (response) {
      return response.results;
    }
  } catch (err) {
    logger.error(
      new RainbowError(`Keychain: failed to loadAllKeys error: ${err}`)
    );
  }
  return null;
}

export async function hasKey(key: string): Promise<boolean | Result> {
  try {
    const result = await hasInternetCredentials(key);
    return result;
  } catch (err) {
    logger.error(
      new RainbowError(
        `Keychain: failed to check if key ${key} exists -  error: ${err}`
      )
    );
  }
  return false;
}

export async function wipeKeychain(): Promise<void> {
  try {
    // clear local storage
    keychainLocalStorage.clearAll();

    // clear keychain
    const results = await loadAllKeys();
    if (results) {
      await Promise.all(
        results?.map(result => resetInternetCredentials(result.username))
      );
      logger.info('Keychain: wiped');
    }
  } catch (e) {
    logger.error(new RainbowError('Keychain: error while wiping keychain'));
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
