import { QueryClient } from '@tanstack/react-query';
import { PersistedClient, Persister, PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { debounce } from 'lodash';
import { REACT_QUERY_STORAGE_ID, queryStorage } from '@/storage/legacy';
import { time } from '@/utils';

class MMKVPersister implements Persister {
  private static readonly throttleMs = time.seconds(8);

  private throttledPersist = debounce(
    (persistedClient: PersistedClient) => {
      queryStorage.set([REACT_QUERY_STORAGE_ID], persistedClient);
    },
    MMKVPersister.throttleMs,
    { leading: false, trailing: true, maxWait: MMKVPersister.throttleMs }
  );

  persistClient(persistedClient: PersistedClient): void {
    this.throttledPersist(persistedClient);
  }

  async restoreClient(): Promise<PersistedClient | undefined> {
    return await queryStorage.get([REACT_QUERY_STORAGE_ID]);
  }

  removeClient(): void {
    queryStorage.remove([REACT_QUERY_STORAGE_ID]);
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: time.minutes(5),
      staleTime: time.minutes(2),
    },
  },
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  maxAge: time.weeks(4),
  persister: new MMKVPersister(),
  dehydrateOptions: {
    shouldDehydrateQuery: query => Boolean(query.cacheTime !== 0 && (query.queryKey[2] as { persisterVersion?: number })?.persisterVersion),
  },
};
