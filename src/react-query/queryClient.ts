import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24 * 7,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  key: 'rainbow.react-query',
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
