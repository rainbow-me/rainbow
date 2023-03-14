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

import { IS_DEV, IS_IOS } from '@/env';

enum ErrorType {
  UserCanceled = -1, // legacy
  NotAuthenticated = -2, // legacy
  Unknown = 0,
  Unavailable = 1,
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
  options: Options = {}
): Promise<Result<string>> {
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
        default: {
          return {
            value: undefined,
            error: ErrorType.Unknown,
          };
        }
      }
    }
  }

  return {
    value: data as any,
    error: data ? undefined : ErrorType.Unavailable,
  };
}

export async function set(
  key: string,
  value: string,
  options: Options = {}
): Promise<void> {
  // only save public data to mmkv
  // private data has accessControl
  if (!options?.accessControl) {
    cache.set(key, value);
  }

  await setInternetCredentials(key, key, value, options);
}

export async function getObject(
  key: string,
  options: Options = {}
): Promise<Result<Record<string, unknown>>> {
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
  await set(key, JSON.stringify(value), options);
}

export async function has(key: string): Promise<boolean> {
  return Boolean(await hasInternetCredentials(key));
}

export async function remove(key: string) {
  cache.delete(key);
  await resetInternetCredentials(key);
}

export async function getAllCredentials(): Promise<UserCredentials[]> {
  const res = await getAllInternetCredentials();
  return res ? res.results : [];
}

export async function clear() {
  cache.clearAll();

  const credentials = await getAllCredentials();

  await Promise.all(
    credentials?.map(c => resetInternetCredentials(c.username))
  );
}

export async function getSupportedBiometryType(): Promise<
  BIOMETRY_TYPE | undefined
> {
  return (await originalGetSupportedBiometryType()) || undefined;
}

export async function getSharedWebCredentials(): Promise<
  SharedWebCredentials | undefined
> {
  const res = await requestSharedWebCredentials();
  return res ? res : undefined;
}

export async function setSharedWebCredentials(
  username: string,
  password: string
) {
  await originalSetSharedWebCredentials('rainbow.me', username, password);
}

export async function getPrivateAccessControlOptions(): Promise<Options> {
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
