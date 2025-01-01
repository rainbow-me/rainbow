import { QueryClient } from '@tanstack/react-query';
import { PersistedClient, Persister, PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { debounce } from 'lodash';
import { REACT_QUERY_STORAGE_ID, queryStorage } from '@/storage/legacy';

const ENABLE_LOGS = false;

class MMKVPersister implements Persister {
  private static readonly throttleMs = 5000;

  private throttledPersist = debounce(
    (persistedClient: PersistedClient) => {
      if (ENABLE_LOGS) console.log('Persisting client');
      queryStorage.set([REACT_QUERY_STORAGE_ID], persistedClient);
    },
    MMKVPersister.throttleMs,
    { leading: false, trailing: true, maxWait: MMKVPersister.throttleMs }
  );

  persistClient(persistedClient: PersistedClient): void {
    this.throttledPersist(persistedClient);
  }

  async restoreClient(): Promise<PersistedClient | undefined> {
    if (ENABLE_LOGS) console.log('Restoring client');
    return await queryStorage.get([REACT_QUERY_STORAGE_ID]);
  }

  removeClient(): void {
    queryStorage.remove([REACT_QUERY_STORAGE_ID]);
  }
}

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;
const TWO_MINUTES = 1000 * 60 * 2;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: SEVEN_DAYS,
      staleTime: TWO_MINUTES,
    },
  },
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: new MMKVPersister(),
  dehydrateOptions: {
    shouldDehydrateQuery: query => Boolean(query.cacheTime !== 0 && (query.queryKey[2] as { persisterVersion?: number })?.persisterVersion),
  },
};
