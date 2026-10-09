import {
  createQueryStore,
  getQueryKey,
  nullObject,
  queryParam,
  type CacheEntry,
  type OptionallyPersistedStore,
  type PersistConfig,
  type QueryStoreConfig,
  type QueryStoreState,
} from '@storesjs/stores';

import { createSelectorReadTracker } from '@/state/internal/utils/createSelectorReadTracker';

// ============ Types ========================================================== //

type Key = string | number;
type Results<Data> = Partial<Record<Key, Data>>;
type Params<Input> = { inputs: Input[]; refresh: boolean };
type State<Input, Data> = QueryStoreState<Results<Data>, Params<Input>, QueryCollectionState<Input, Data>>;

/** Custom state connecting subscribed resource reads to the query store. */
export type QueryCollectionState<Input, Data> = {
  inputs: Input[];
  /** Reads cached data. Subscribed reads also keep this input in the collection's refresh set. */
  get: (input: Input) => Data | undefined;
  /** Fetches a resource again, preserving its previous value until the request completes. */
  refresh: (input: Input) => Promise<Data | undefined>;
};

/** Defines a shared collection's resource identity, loader, and cache policy. */
export type QueryCollectionConfig<Input, Data> = Pick<
  QueryStoreConfig<Results<Data>, Params<Input>, Results<Data>, QueryCollectionState<Input, Data>>,
  'enabled' | 'retry' | 'retryDelay' | 'paramChangeThrottle' | 'disableAutoRefetching' | 'abortInterruptedFetches'
> & {
  /** Inputs with the same key identify the same resource. */
  key: (input: Input) => Key;
  fetcher: (input: Input, signal: AbortSignal | undefined) => Promise<Data>;
  /** Member freshness in milliseconds. Positive finite values also set the native refresh interval. */
  staleTime: number;
  /** Age at which entries become eligible for native cache pruning, in milliseconds. */
  cacheTime: number;
};

/** Configures the collection's native synchronous persistence. Consumer demand is never persisted. */
export type QueryCollectionPersistence<Input, Data> = Pick<
  PersistConfig<State<Input, Data>>,
  'storageKey' | 'storage' | 'version' | 'migrate' | 'persistThrottleMs'
>;

// ============ Constants ====================================================== //

const EMPTY_CUSTOM_STATE = Object.freeze({});

// ============ Factory ======================================================== //

/**
 * Shares keyed data through one query store. Consumer reads determine demand;
 * each execution fetches stale members and retains successful results independently.
 *
 * Native status and retries describe the batch. Native `force` starts a collection
 * evaluation; `refresh(input)` also bypasses member freshness. Native `fetch` returns
 * newly fetched successes, or null on a batch cache hit; `get` reads retained values.
 */
export function createQueryCollectionStore<Input, Data>(
  { key: getKey, fetcher, staleTime, cacheTime, enabled = true, ...queryOptions }: QueryCollectionConfig<Input, Data>,
  persistence?: QueryCollectionPersistence<Input, Data>
): OptionallyPersistedStore<State<Input, Data>, Partial<State<Input, Data>>> {
  const reads = createSelectorReadTracker<Key>();
  let inputsByKey: Record<Key, Input> = nullObject();
  let demandedKeys: Key[] = [];
  let demandUpdatePending = false;

  const store = createQueryStore<Results<Data>, Params<Input>, QueryCollectionState<Input, Data>>(
    {
      ...queryOptions,
      params: {
        inputs: queryParam(($, store) => $(store, s => s.inputs), { key: inputs => inputs.map(getKey).sort() }),
        refresh: queryParam(false, { key: false }),
      },
      enabled: ($, store) => {
        const allowed = typeof enabled === 'function' ? enabled($, store) : enabled;
        const hasDemand = $(store, s => s.inputs.length > 0);
        return allowed && hasDemand;
      },
      staleTime,
      cacheTime: 0,
      keepPreviousData: true,
      fetcher: fetchMembers,
      setData: ({ data, params, queryKey, set }) => {
        set(s => {
          const queryCache = { ...s.queryCache };
          const lastFetchedAt = Date.now();
          for (const key in data) {
            queryCache[`:${key}`] = { data: { [key]: data[key] }, lastFetchedAt, cacheTime, errorInfo: null };
          }
          queryCache[queryKey] = batchEntry(params.inputs, queryCache);
          return { queryCache };
        });
      },
    },
    (_, get) => ({
      inputs: [],
      get: input => {
        const key = getKey(input);
        if (reads.track(key)) inputsByKey[key] = input;
        return get().queryCache[`:${key}`]?.data?.[key];
      },
      refresh: async input => {
        await get().fetch({ inputs: [input], refresh: true }, { force: true, throwOnError: true });
        return get().get(input);
      },
    }),
    persistence ? { ...persistence, partialize: () => EMPTY_CUSTOM_STATE } : undefined
  );

  async function fetchMembers({ inputs, refresh }: Params<Input>, controller: AbortController | null): Promise<Results<Data>> {
    const queryCache = store.getState().queryCache;
    const staleCutoff = Date.now() - staleTime;
    const staleInputs = refresh
      ? inputs
      : inputs.filter(input => {
          const lastFetchedAt = queryCache[`:${getKey(input)}`]?.lastFetchedAt;
          return !lastFetchedAt || lastFetchedAt <= staleCutoff;
        });
    const settled = await Promise.allSettled(staleInputs.map(async input => fetcher(input, controller?.signal)));
    const data: Results<Data> = nullObject();
    let firstFailure: PromiseRejectedResult | undefined;
    let succeeded = false;

    for (let i = 0; i < settled.length; i++) {
      const result = settled[i];
      if (result.status === 'fulfilled') {
        data[getKey(staleInputs[i])] = result.value;
        succeeded = true;
      } else firstFailure ??= result;
    }
    if (!succeeded && firstFailure) throw firstFailure.reason;
    return data;
  }

  function batchEntry(inputs: Input[], queryCache: State<Input, Data>['queryCache']): CacheEntry<Results<Data>> {
    let lastFetchedAt = Date.now();
    for (const input of inputs) lastFetchedAt = Math.min(lastFetchedAt, queryCache[`:${getKey(input)}`]?.lastFetchedAt ?? 0);
    return { data: null, lastFetchedAt, cacheTime: 0, errorInfo: null };
  }

  function updateDemand(): void {
    demandUpdatePending = false;
    const inputs: Input[] = [];
    const nextInputs: Record<Key, Input> = nullObject();
    for (const key of demandedKeys) {
      const input = inputsByKey[key];
      inputs.push(input);
      nextInputs[key] = input;
    }
    inputsByKey = nextInputs;

    store.setState(s => {
      const queryCache = { ...s.queryCache };
      delete queryCache[s.queryKey];
      if (inputs.length) queryCache[getQueryKey({ inputs: demandedKeys })] = batchEntry(inputs, queryCache);
      return { inputs, queryCache };
    });
  }

  return reads.install(store, keys => {
    demandedKeys = keys.sort();
    if (demandUpdatePending) return;
    demandUpdatePending = true;
    queueMicrotask(updateDemand);
  });
}
