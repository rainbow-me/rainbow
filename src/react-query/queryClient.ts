import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { PersistedClient, Persister, PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import { debounce } from 'lodash';
import { REACT_QUERY_STORAGE_ID, queryStorage } from '@/storage/legacy';
import { time } from '@/utils';
import { ensureError, logger, RainbowError } from '@/logger';

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
  queryCache: new QueryCache({
    onError: (e, query) => {
      /**
       * The error that bubbles up from failed arc requests is not useful: (Error: There was an error with the request.)
       * This only works for arc request errors
       */
      const queryError = query.state.error as { responseBody?: { errors?: { message: string }[] } };
      if (queryError?.responseBody?.errors?.length) {
        const errorMessage = queryError.responseBody.errors[0].message;
        const error = new RainbowError(`[React Query Error]: ${errorMessage}`, e);
        logger.error(error, {
          queryKey: query.queryKey,
        });
      }
    },
  }),
  defaultOptions: {
    queries: {
      cacheTime: time.minutes(5),
      staleTime: time.minutes(2),
    },
  },
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  dehydrateOptions: {
    shouldDehydrateQuery: query => Boolean(query.cacheTime !== 0 && (query.queryKey[2] as { persisterVersion?: number })?.persisterVersion),
  },
  maxAge: time.weeks(4),
  buster: '2',
  persister: new MMKVPersister(),
};
