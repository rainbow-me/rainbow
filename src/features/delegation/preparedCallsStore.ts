import { createQueryStore, getQueryKey, type QueryStore, type QueryStoreConfig } from '@storesjs/stores';

import { time } from '@/framework/core/utils/time';

// ============ Types ========================================================= //

type PreparedCallsStoreActions<TPrepared, TParams extends Record<string, unknown>> = {
  getPreparedCalls: (params: TParams) => Promise<TPrepared | null>;
};

type PreparedCallsStoreOptions<TPrepared, TParams extends Record<string, unknown>> = Pick<
  QueryStoreConfig<TPrepared | null, TParams, TPrepared | null, PreparedCallsStoreActions<TPrepared, TParams>>,
  'cacheTime' | 'enabled' | 'keepPreviousData' | 'params' | 'staleTime'
>;

export type PreparedCallsStore<TPrepared, TParams extends Record<string, unknown>> = QueryStore<
  TPrepared | null,
  TParams,
  PreparedCallsStoreActions<TPrepared, TParams>
>;

// ============ Store Factory ================================================= //

/**
 * Creates a query store that prepares calls ahead of execution.
 * Intended for use with the SDK's `execute.prepare.calls(...)`.
 */
export function createPreparedCallsStore<TPrepared, TParams extends Record<string, unknown>>(
  fetcher: (params: TParams) => Promise<TPrepared | null>,
  options: PreparedCallsStoreOptions<TPrepared, TParams> = {}
): PreparedCallsStore<TPrepared, TParams> {
  const { cacheTime = time.minutes(1), staleTime = time.seconds(20), ...queryOptions } = options;

  return createQueryStore<TPrepared | null, TParams, PreparedCallsStoreActions<TPrepared, TParams>>(
    {
      ...queryOptions,
      fetcher,
      cacheTime,
      staleTime,
    },

    (_, get) => {
      let consumedQueryKey: string | null = null;

      return {
        getPreparedCalls: async params => {
          const queryKey = getQueryKey(params);
          const shouldForceRefresh = consumedQueryKey === queryKey;
          consumedQueryKey = queryKey;

          return get().fetch(params, shouldForceRefresh ? { force: true } : undefined);
        },
      };
    }
  );
}
