import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { MMKV } from 'react-native-mmkv';
import { queryStorage } from '@/storage/legacy';

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: SEVEN_DAYS,
    },
  },
});

export const persistedQueryStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return queryStorage.get([key]);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await queryStorage.set([key], value);
  },
  removeItem: async (key: string): Promise<void> => {
    await queryStorage.remove([key]);
  },
};

const asyncStoragePersister = createAsyncStoragePersister({
  key: 'rainbow.react-query',
  storage: persistedQueryStorage,
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
