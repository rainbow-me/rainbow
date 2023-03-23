import DeviceInfo from 'react-native-device-info';
import {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  canImplyAuthentication,
  getAllInternetCredentials,
  getInternetCredentials,
  getSupportedBiometryType as originalGetSupportedBiometryType,
  hasInternetCredentials,
  Options,
  resetInternetCredentials,
  setInternetCredentials,
  UserCredentials,
  BIOMETRY_TYPE,
  requestSharedWebCredentials,
  setSharedWebCredentials as originalSetSharedWebCredentials,
  SharedWebCredentials,
} from 'react-native-keychain';
import { MMKV } from 'react-native-mmkv';

import { delay } from '@/helpers/utilities';
import { IS_DEV, IS_IOS } from '@/env';
import { logger } from '@/logger';

export enum ErrorType {
  Unknown = 0,
  UserCanceled = -1, // legacy
  NotAuthenticated = -2, // legacy
  Unavailable = -3,
}

type Result<T = any> =
  | {
      value: T;
      error: undefined;
    }
  | {
      value: undefined;
      error: ErrorType;
    };

const cache = new MMKV({
  id: 'rainbowKeychainLocalStorage',
});

export const publicAccessControlOptions: Options = {
  accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function get(
  key: string,
  options: Options = {},
  attempts = 0
): Promise<Result<string>> {
  logger.debug(`keychain: get`, { key }, logger.DebugContext.keychain);

  let data = cache.getString(key);

  if (!data) {
    try {
      const result = await getInternetCredentials(key, options);

      if (result) {
        data = result.password;
      }
    } catch (e: any) {
      switch (e.toString()) {
        case 'Error: User canceled the operation.': {
          return {
            value: undefined,
            error: ErrorType.UserCanceled,
          };
        }
        case 'Error: Wrapped error: User not authenticated': {
          return {
            value: undefined,
            error: ErrorType.NotAuthenticated,
          };
        }
        case 'Error: The user name or passphrase you entered is not correct.': {
          if (attempts > 2) {
            return {
              value: undefined,
              error: ErrorType.NotAuthenticated,
            };
          }

          // try again
          await delay(1000);
          return get(key, options, attempts + 1);
        }
        default: {
          return {
            value: undefined,
            error: ErrorType.Unknown,
          };
        }
      }
    }
  }

  return data
    ? {
        value: data,
        error: undefined,
      }
    : {
        value: undefined,
        error: ErrorType.Unavailable,
      };
}

export async function set(
  key: string,
  value: string,
  options: Options = {}
): Promise<void> {
  logger.debug(`keychain: set`, { key }, logger.DebugContext.keychain);

  // only save public data to mmkv
  // private data has accessControl
  if (!options?.accessControl) {
    cache.set(key, value);
  }

  await setInternetCredentials(key, key, String(value), options);
}

export async function getObject(
  key: string,
  options: Options = {}
): Promise<Result<Record<string, unknown>>> {
  logger.debug(`keychain: getObject`, { key }, logger.DebugContext.keychain);

  const { value, error } = await get(key, options);

  if (error || !value) {
    return { value: undefined, error: error || ErrorType.Unknown };
  }

  return {
    value: JSON.parse(value),
    error: undefined,
  };
}

export async function setObject(
  key: string,
  value: Record<string, any>,
  options: Options = {}
): Promise<void> {
  logger.debug(`keychain: setObject`, { key }, logger.DebugContext.keychain);

  await set(key, JSON.stringify(value), options);
}

export async function has(key: string): Promise<boolean> {
  logger.debug(`keychain: has`, { key }, logger.DebugContext.keychain);
  return Boolean(await hasInternetCredentials(key));
}

export async function remove(key: string) {
  logger.debug(`keychain: remove`, { key }, logger.DebugContext.keychain);

  cache.delete(key);
  await resetInternetCredentials(key);
}

export async function getAllCredentials(): Promise<UserCredentials[]> {
  logger.debug(`keychain: getAllCredentials`, {}, logger.DebugContext.keychain);
  const res = await getAllInternetCredentials();
  return res ? res.results : [];
}

export async function clear() {
  logger.debug(`keychain: clear`, {}, logger.DebugContext.keychain);

  cache.clearAll();

  const credentials = await getAllCredentials();

  await Promise.all(
    credentials?.map(c => resetInternetCredentials(c.username))
  );
}

export async function getSupportedBiometryType(): Promise<
  BIOMETRY_TYPE | undefined
> {
  logger.debug(
    `keychain: getSupportedBiometryType`,
    {},
    logger.DebugContext.keychain
  );
  return (await originalGetSupportedBiometryType()) || undefined;
}

export async function getSharedWebCredentials(): Promise<
  Result<SharedWebCredentials | undefined>
> {
  logger.debug(
    `keychain: getSharedWebCredentials`,
    {},
    logger.DebugContext.keychain
  );

  let data = undefined;

  try {
    data = await requestSharedWebCredentials();
  } catch (e: any) {
    /**
     * Throws if not supported or credentials not found
     * @see https://github.com/oblador/react-native-keychain/blob/f3003e8208f6561a77d6fad0544d9a73a6731663/README.md?plain=1#L142
     */
  }

  return data
    ? {
        value: data,
        error: undefined,
      }
    : {
        value: undefined,
        error: ErrorType.Unavailable,
      };
}

export async function setSharedWebCredentials(
  username: string,
  password: string
) {
  logger.debug(
    `keychain: setSharedWebCredentials`,
    {},
    logger.DebugContext.keychain
  );
  await originalSetSharedWebCredentials('rainbow.me', username, password);
}

export async function getPrivateAccessControlOptions(): Promise<Options> {
  logger.debug(
    `keychain: getPrivateAccessControlOptions`,
    {},
    logger.DebugContext.keychain
  );

  let canAuthenticate = false;

  if (IS_IOS) {
    canAuthenticate = await canImplyAuthentication({
      authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
    });
  } else {
    canAuthenticate = Boolean(await getSupportedBiometryType());
  }

  const isSimulator = IS_DEV && (await DeviceInfo.isEmulator());

  if (canAuthenticate && !isSimulator) {
    return {
      accessControl: ios
        ? ACCESS_CONTROL.USER_PRESENCE
        : ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
      accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    };
  }

  return {};
}
