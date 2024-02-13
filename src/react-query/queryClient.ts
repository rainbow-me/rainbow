import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { MMKV } from 'react-native-mmkv';

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: SEVEN_DAYS,
    },
  },
});

const storage = new MMKV();

const clientStorage = {
  setItem: (key, value) => {
    storage.set(key, value);
  },
  getItem: key => {
    const value = storage.getString(key);
    return value === undefined ? '' : value;
  },
  removeItem: key => {
    storage.delete(key);
  },
};

const asyncStoragePersister = createAsyncStoragePersister({
  key: 'rainbow.react-query.mmkv',
  storage: AsyncStorage,
  throttleTime: 2000,
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: asyncStoragePersister,
  dehydrateOptions: {
    shouldDehydrateQuery: query =>
      Boolean(
        // We want to persist queries that have a `cacheTime` of above zero.
        query.cacheTime !== 0 &&
          // We want to persist queries that have `persisterVersion` in their query key.
          (query.queryKey[2] as { persisterVersion?: number })?.persisterVersion
      ),
  },
};
