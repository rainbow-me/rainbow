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

/**
 * Custom state connecting subscribed resource reads to the query store.
 * Nullish inputs select no resource: `get` returns undefined, `hasSettled` returns false,
 * and `getError` returns null, without creating demand.
 */
export type QueryCollectionState<Input, Data> = {
  inputs: KeyedInput<Input>[];
  /** Whether this input has completed a lookup, including absence or failure. Remains true during refresh. */
  hasSettled: (input: Input | null | undefined) => boolean;
  /** The latest lookup error, without discarding any previous data. */
  getError: (input: Input | null | undefined) => Error | null;
  /** Fetches a resource if stale or forced, sharing any request already in progress. */
  load: (input: Input, options?: { force?: boolean }) => Promise<Data | undefined>;
  /** Reads cached data. Subscribed reads also keep this input in the collection's refresh set. */
  get: (input: Input | null | undefined) => Data | undefined;
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

type Key = string | number;
type KeyedInput<Input> = { key: Key; input: Input };
type Request<Data> = { controller: AbortController; promise: Promise<Data>; retained: boolean };
type Results<Data> = Partial<Record<Key, Data>>;

type Params<Input> = { inputs: KeyedInput<Input>[]; refresh: boolean; retained: boolean };
type State<Input, Data> = QueryStoreState<Results<Data>, Params<Input>, QueryCollectionState<Input, Data>>;

type PublicState<Input, Data> = Omit<
  State<Input, Data>,
  'fetch' | 'getData' | 'getStatus' | 'isDataExpired' | 'isStale' | 'lastFetchedAt' | 'status' | 'error' | 'inputs' | 'queryKey'
>;

// ============ Constants ====================================================== //

const ABORT_OPTIONS = Object.freeze({ once: true });
const EMPTY_OBJECT = Object.freeze({});
const FETCH_OPTIONS = Object.freeze({ force: true, throwOnError: true });
const RESOLVED_PROMISE = Promise.resolve();

// ============ Factory ======================================================== //

/**
 * Shares keyed data through one query store. Consumer reads determine demand;
 * each execution fetches stale members and retains successful results independently.
 *
 * Native status, retries, refresh timing and cache pruning describe the batch.
 * Member accessors expose cached data and completed outcomes independently.
 * `reset()` destroys the collection and cancels all outstanding work.
 */
export function createQueryCollectionStore<Input, Data>(
  { key: getKey, fetcher, staleTime, cacheTime, enabled = true, ...queryOptions }: QueryCollectionConfig<Input, Data>,
  persistence?: QueryCollectionPersistence<Input, Data>
): OptionallyPersistedStore<PublicState<Input, Data>, Partial<State<Input, Data>>> {
  const readTracker = createSelectorReadTracker<Key>();
  const requests: Partial<Record<Key, Request<Data>>> = nullObject();

  let inputsByKey: Record<Key, Input> = nullObject();
  let demandUpdatePending = false;
  let destroyed = false;
  let pendingEntries: State<Input, Data>['queryCache'] | undefined;

  const store = createQueryStore<Results<Data>, Params<Input>, QueryCollectionState<Input, Data>>(
    {
      ...queryOptions,
      fetcher: fetchMembers,
      enabled: ($, store) => {
        const allowed = typeof enabled === 'function' ? enabled($, store) : enabled;
        const hasDemand = $(store, s => s.inputs.length > 0);
        return allowed && hasDemand;
      },
      setData: context => {
        context.set(s => ({ queryCache: { ...s.queryCache, [context.queryKey]: batchEntry(context.params.inputs, s.queryCache) } }));
      },
      params: {
        inputs: queryParam(($, store) => $(store, s => s.inputs), { key: inputs => inputs.map(input => input.key) }),
        refresh: false,
        retained: false,
      },
      staleTime,
      cacheTime: 0,
      keepPreviousData: true,
    },

    (_, get) => ({
      inputs: [],

      get: input => {
        if (input == null) return undefined;
        const key = trackInput(input);
        return get().queryCache[`:${key}`]?.data?.[key];
      },

      getError: input => {
        if (input == null) return null;
        return get().queryCache[`:${trackInput(input)}`]?.errorInfo?.error ?? null;
      },

      hasSettled: input => {
        if (input == null) return false;
        const cached = get().queryCache[`:${trackInput(input)}`];
        return cached?.lastFetchedAt != null || cached?.errorInfo != null;
      },

      load: async (input, { force = false } = EMPTY_OBJECT) => {
        const key = getKey(input);
        await get().fetch({ inputs: [{ key, input }], refresh: force, retained: true }, FETCH_OPTIONS);
        return get().queryCache[`:${key}`]?.data?.[key];
      },
    }),

    persistence
      ? {
          ...persistence,
          partialize: () => EMPTY_OBJECT,
          merge: (persisted, current) => {
            const queryCache: State<Input, Data>['queryCache'] = {};
            for (const key in persisted?.queryCache) {
              const cached = persisted.queryCache[key];
              if (key.startsWith(':') && cached?.lastFetchedAt != null) queryCache[key] = { ...cached, cacheTime, errorInfo: null };
            }
            return { ...current, queryCache };
          },
        }
      : undefined
  );

  const reset = store.getState().reset;
  store.getState().reset = resetState => {
    destroyed = true;
    for (const key in requests) requests[key]?.controller.abort();
    reset(resetState);
  };

  function trackInput(input: Input): Key {
    const key = getKey(input);
    if (readTracker.track(key)) inputsByKey[key] = input;
    return key;
  }

  function request({ key, input }: KeyedInput<Input>, retained: boolean): Request<Data> {
    const active = requests[key];

    if (active && !active.controller.signal.aborted) {
      active.retained ||= retained;
      return active;
    }

    const controller = new AbortController();
    const current: Request<Data> = {
      controller,
      retained,
      promise: RESOLVED_PROMISE.then(() => {
        if (controller.signal.aborted) throw new Error('Query collection request cancelled');
        return fetcher(input, controller.signal);
      }),
    };

    requests[key] = current;
    current.promise = current.promise
      .then(
        value => {
          publish(key, current, { data: { [key]: value }, lastFetchedAt: Date.now(), cacheTime, errorInfo: null });
          return value;
        },
        reason => {
          const error = reason instanceof Error ? reason : new Error(String(reason));
          const previous = store.getState().queryCache[`:${key}`];
          publish(key, current, {
            data: previous?.data ?? null,
            lastFetchedAt: previous?.lastFetchedAt ?? null,
            cacheTime,
            errorInfo: { error, lastFailedAt: Date.now(), retryAllowed: false, retryCount: 0 },
          });
          throw error;
        }
      )
      .finally(() => {
        if (requests[key] === current) delete requests[key];
      });

    return current;
  }

  function publish(key: Key, request: Request<Data>, entry: CacheEntry<Results<Data>>): void {
    if (!destroyed && !request.controller.signal.aborted && requests[key] === request) {
      if (!pendingEntries) {
        pendingEntries = {};
        queueMicrotask(flushEntries);
      }
      pendingEntries[`:${key}`] = entry;
    }
  }

  function flushEntries(): void {
    const entries = pendingEntries;
    pendingEntries = undefined;
    if (destroyed) return;
    store.setState(s => ({ queryCache: { ...s.queryCache, ...entries } }));
  }

  async function fetchMembers({ inputs, refresh }: Params<Input>, controller: AbortController | null): Promise<Results<Data>> {
    const queryCache = store.getState().queryCache;
    const staleCutoff = Date.now() - staleTime;
    const pending: Promise<Data>[] = [];

    for (const input of inputs) {
      const cached = queryCache[`:${input.key}`];
      if (refresh || !cached?.lastFetchedAt || cached.errorInfo != null || cached.lastFetchedAt <= staleCutoff) {
        pending.push(request(input, controller === null).promise);
      }
    }

    controller?.signal.addEventListener('abort', cancelUnusedRequests, ABORT_OPTIONS);
    const settled = await Promise.allSettled(pending);
    controller?.signal.removeEventListener('abort', cancelUnusedRequests);

    if (settled.length && settled.every(result => result.status === 'rejected')) throw settled[0].reason;
    return EMPTY_OBJECT;
  }

  function cancelUnusedRequests(): void {
    const enabled = store.getState().enabled;
    for (const key in requests) {
      const request = requests[key];
      if (request && !request.retained && (!enabled || !(key in inputsByKey))) request.controller.abort();
    }
  }

  function batchEntry(inputs: KeyedInput<Input>[], queryCache: State<Input, Data>['queryCache']): CacheEntry<Results<Data>> {
    let lastFetchedAt = Date.now();
    for (const input of inputs) {
      const cached = queryCache[`:${input.key}`];
      lastFetchedAt = Math.min(lastFetchedAt, Math.max(cached?.lastFetchedAt ?? 0, cached?.errorInfo?.lastFailedAt ?? 0));
    }
    return { data: null, lastFetchedAt, cacheTime: 0, errorInfo: null };
  }

  function updateDemand(): void {
    demandUpdatePending = false;
    if (destroyed) return;

    const demandedKeys = readTracker.getKeys().sort();
    const inputs: KeyedInput<Input>[] = [];
    const nextInputs: Record<Key, Input> = nullObject();

    for (const key of demandedKeys) {
      const input = inputsByKey[key];
      inputs.push({ key, input });
      nextInputs[key] = input;
    }

    inputsByKey = nextInputs;
    cancelUnusedRequests();

    store.setState(s => {
      const queryCache = { ...s.queryCache };
      delete queryCache[s.queryKey];
      const queryKey = getQueryKey({ inputs: demandedKeys, refresh: false, retained: false });
      delete queryCache[queryKey];

      if (inputs.length && inputs.every(input => queryCache[`:${input.key}`]?.errorInfo == null)) {
        queryCache[queryKey] = batchEntry(inputs, queryCache);
      }
      return { inputs, queryCache };
    });
  }

  return readTracker.install(store, () => {
    if (demandUpdatePending) return;
    demandUpdatePending = true;
    queueMicrotask(updateDemand);
  });
}
