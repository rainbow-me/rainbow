import DeviceInfo from 'react-native-device-info';
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
import { delay } from '../helpers/utilities';
import { logger, RainbowError } from '@/logger';
import { MMKV } from 'react-native-mmkv';

const keychainLocalStorage = new MMKV({
  id: 'rainbowKeychainLocalStorage',
});

/**
 * IMPORTANT
 *
 * Log keys in debug mode only, do not send to Sentry.
 */

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
      // only save public data to mmkv
      // private data has accessControl
      if (!accessControlOptions?.accessControl) {
        saveStringMMKV(key, value);
      }

      // save to keychain
      await setInternetCredentials(key, key, value, accessControlOptions);

      logger.debug(
        `Keychain: saved string`,
        { key },
        logger.DebugContext.keychain
      );

      resolve();
    } catch (e) {
      logger.info(`Keychain: first attempt failed to save string`, {
        type: 'error',
      });

      await delay(1000);

      try {
        let acOptions = accessControlOptions;
        // This is a bug on iOS 14 and 15 simulators
        // See https://github.com/oblador/react-native-keychain/issues/509
        if (IS_TESTING === 'true') {
          acOptions.accessControl = undefined;
        }

        await setInternetCredentials(key, key, value, acOptions);

        logger.debug(
          `Keychain: saved string on second attempt`,
          { key },
          logger.DebugContext.keychain
        );

        resolve();
      } catch (e) {
        logger.error(new RainbowError(`Keychain: failed to save string`), {
          message: (e as Error).message,
        });
        reject(e);
      }
    }
  });
}

export async function loadString(
  key: string,
  options?: Options
): Promise<null | string | -1 | -2> {
  // if the data is public, try to load from MMKV first
  if (!options) {
    try {
      const data = loadStringMMKV(key);
      if (data) {
        return data;
      }
    } catch (e) {
      logger.info(`Keychain: failed to load string from MMKV`);
    }
  }

  // load from keychain if not found in MMKV (private or does not exist)
  try {
    const credentials = await getInternetCredentials(key, options);

    logger.debug(
      `Keychain: loading string`,
      { key },
      logger.DebugContext.keychain
    );

    if (credentials) {
      return credentials.password;
    }

    logger.info(`Keychain: string does not exist`, {
      type: 'error',
    });
  } catch (e) {
    /**
     * Note on this error handling: we can't realistically handle all the
     * possible errors here, so we just handle the few we want to handle
     */

    if ((e as Error).toString() === 'Error: User canceled the operation.') {
      logger.info(`Keychain: user canceled the operation`);
      return -1;
    }
    if (
      (e as Error).toString() === 'Error: Wrapped error: User not authenticated'
    ) {
      logger.info(`Keychain: user not authenticated`);
      return -2;
    }

    if (
      (e as Error).toString() ===
      'Error: The user name or passphrase you entered is not correct.'
    ) {
      logger.info('Keychain: load string first attempt failed', {
        type: 'error',
      });

      await delay(1000);

      try {
        const credentials = await getInternetCredentials(key, options);

        if (credentials) {
          logger.info(`Keychain: loaded string on second attempt`);
          return credentials.password;
        }

        logger.info(`Keychain: string does not exist`, {
          type: 'error',
        });
      } catch (e) {
        if ((e as Error).toString() === 'Error: User canceled the operation.') {
          logger.info(`Keychain: user canceled the operation`);
          return -1;
        }
        if (
          (e as Error).toString() ===
          'Error: Wrapped error: User not authenticated'
        ) {
          logger.info(`Keychain: user not authenticated`);
          return -2;
        }

        /**
         * Could fail here for any unknown or unhandled reason e.g.
         * "Fingerprint operation cancelled by user".
         *
         * Therefore, we just add a breadcrumb. If it causes issues at the
         * callsite, we should be emitting better errors there with more
         * context.
         */
        logger.info(`Keychain: failed to load string`, {
          message: (e as Error).message,
          type: 'error',
        });
      }
      return null;
    }

    /**
     * See last comment, same thing.
     */
    logger.info(`Keychain: failed to load string`, {
      message: (e as Error).message,
      type: 'error',
    });
  }
  return null;
}

export async function saveObject(
  key: string,
  value: Record<string, unknown>,
  accessControlOptions: Options
): Promise<void> {
  logger.debug(
    `Keychain: save object`,
    { key, accessControlOptions },
    logger.DebugContext.keychain
  );
  const jsonValue = JSON.stringify(value);

  // only save public data to mmkv
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
  // if the data is public, try to load from MMKV first
  try {
    const jsonValueMMKV = loadStringMMKV(key);
    if (jsonValueMMKV) {
      const objectValue = JSON.parse(jsonValueMMKV);
      return objectValue;
    }
  } catch (e) {
    logger.error(new RainbowError('Keychain: failed to load object from MMKV'));
  }

  // load from keychain if not found in MMKV (private or does not exist)
  logger.debug(
    `Keychain: load object`,
    { key, options },
    logger.DebugContext.keychain
  );

  const jsonValue = await loadString(key, options);
  if (!jsonValue) return null;
  if (jsonValue === -1 || jsonValue === -2) {
    return jsonValue;
  }
  try {
    const objectValue = JSON.parse(jsonValue);
    return objectValue;
  } catch (e) {
    logger.error(new RainbowError(`Keychain: failed to parse object`), {
      message: (e as Error).message,
    });
  }
  return null;
}

export async function remove(key: string): Promise<void> {
  logger.debug(
    `Keychain: removed value`,
    { key },
    logger.DebugContext.keychain
  );

  try {
    // remove from MMKV
    keychainLocalStorage.delete(key);
  } catch (e) {
    logger.error(
      new RainbowError(`Keychain: failed to remove value from MMKV`),
      {
        message: (e as Error).message,
      }
    );
  }

  try {
    // remove from keychain
    await resetInternetCredentials(key);
  } catch (e) {
    logger.error(
      new RainbowError(`Keychain: failed to remove value from keychain`),
      {
        message: (e as Error).message,
      }
    );
  }
}

export async function loadAllKeys(): Promise<null | UserCredentials[]> {
  logger.debug(`Keychain: loadAllKeys`, {}, logger.DebugContext.keychain);

  try {
    const response = await getAllInternetCredentials();
    if (response) {
      return response.results;
    }
  } catch (e) {
    logger.error(new RainbowError(`Keychain: failed to loadAllKeys`), {
      message: (e as Error).message,
    });
  }
  return null;
}

export async function hasKey(key: string): Promise<boolean | Result> {
  logger.debug(`Keychain: hasKey`, { key }, logger.DebugContext.keychain);

  try {
    const result = await hasInternetCredentials(key);
    return result;
  } catch (e) {
    logger.error(new RainbowError(`Keychain: failed to check if key exists`), {
      message: (e as Error).message,
    });
  }
  return false;
}

export async function wipeKeychain(): Promise<void> {
  logger.info('Keychain: wipeKeychain');

  try {
    // clear mmkv storage
    keychainLocalStorage.clearAll();
  } catch (e) {
    logger.error(new RainbowError('Keychain: error while wiping MMKV'), {
      message: (e as Error).message,
    });
  }

  try {
    // clear keychain
    const results = await loadAllKeys();
    if (results) {
      await Promise.all(
        results?.map(result => resetInternetCredentials(result.username))
      );
    }
  } catch (e) {
    logger.error(new RainbowError('Keychain: error while wiping keychain'), {
      message: (e as Error).message,
    });
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
