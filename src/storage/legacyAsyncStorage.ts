import type ReactNativeStorage from 'react-native-storage';

import { logger, RainbowError } from '@/logger';

declare global {
  var storage: ReactNativeStorage;
}

export const LEGACY_ASYNC_STORAGE_VERSION = '0.1.0';

type VersionedLegacyValue = {
  storageVersion?: string;
};

export async function getLegacyAsyncStorageValue<T>(key = '', version = LEGACY_ASYNC_STORAGE_VERSION): Promise<T | null> {
  try {
    const result: (T & VersionedLegacyValue) | null = await storage.load<T & VersionedLegacyValue>({
      autoSync: false,
      key,
      syncInBackground: false,
    });
    if (!result) return null;

    if (result.storageVersion === version) {
      return result;
    }

    removeLegacyAsyncStorageValue(key);
    return null;
  } catch (error) {
    // Missing and expired keys are expected while migrating legacy data.
    // They do not need to be reported to Sentry.
    if (!(error instanceof Error) || !['NotFoundError', 'ExpiredError'].includes(error.name)) {
      logger.error(new RainbowError('[storage/legacyAsyncStorage]: Unable to read legacy data'));
    }
    return null;
  }
}

export function removeLegacyAsyncStorageValue(key = ''): void {
  try {
    void storage.remove({ key });
  } catch {
    logger.error(new RainbowError('[storage/legacyAsyncStorage]: Unable to remove legacy data'));
  }
}
