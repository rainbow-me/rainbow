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
type Params<Input> = { inputs: Input[]; refresh: boolean; retained: boolean };
type Request<Data> = { controller: AbortController; promise: Promise<Data>; retained: boolean };
type State<Input, Data> = QueryStoreState<Results<Data>, Params<Input>, QueryCollectionState<Input, Data>>;

/** Custom state connecting subscribed resource reads to the query store. */
export type QueryCollectionState<Input, Data> = {
  inputs: Input[];
  /** Whether this input has completed a lookup, including absence or failure. Remains true during refresh. */
  hasSettled: (input: Input) => boolean;
  /** The latest lookup error, without discarding any previous data. */
  getError: (input: Input) => Error | null;
  /** Loads a resource if stale, sharing any request already in progress. */
  load: (input: Input) => Promise<Data | undefined>;
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
 * Native status, retries, refresh timing and cache pruning describe the batch.
 * Member accessors expose cached data and completed outcomes independently.
 * `reset()` destroys the collection and cancels all outstanding work.
 */
export function createQueryCollectionStore<Input, Data>(
  { key: getKey, fetcher, staleTime, cacheTime, enabled = true, ...queryOptions }: QueryCollectionConfig<Input, Data>,
  persistence?: QueryCollectionPersistence<Input, Data>
): OptionallyPersistedStore<Omit<State<Input, Data>, 'fetch'>, Partial<State<Input, Data>>> {
  const readTracker = createSelectorReadTracker<Key>();
  const requests: Partial<Record<Key, Request<Data>>> = nullObject();

  let inputsByKey: Record<Key, Input> = nullObject();
  let demandedKeys: Key[] = [];
  let demandUpdatePending = false;
  let destroyed = false;

  const store = createQueryStore<Results<Data>, Params<Input>, QueryCollectionState<Input, Data>>(
    {
      ...queryOptions,
      fetcher: fetchMembers,
      enabled: ($, store) => {
        const allowed = typeof enabled === 'function' ? enabled($, store) : enabled;
        const hasDemand = $(store, s => s.inputs.length > 0);
        return allowed && hasDemand;
      },
      setData: ({ params, queryKey, set }) => {
        set(s => ({ queryCache: { ...s.queryCache, [queryKey]: batchEntry(params.inputs, s.queryCache) } }));
      },
      params: {
        inputs: queryParam(($, store) => $(store, s => s.inputs), { key: inputs => inputs.map(getKey).sort() }),
        refresh: queryParam(false, { key: false }),
        retained: false,
      },
      staleTime,
      cacheTime: 0,
      keepPreviousData: true,
    },

    (_, get) => ({
      inputs: [],

      get: input => {
        const key = trackInput(input);
        return get().queryCache[`:${key}`]?.data?.[key];
      },

      getError: input => get().queryCache[`:${trackInput(input)}`]?.errorInfo?.error ?? null,

      hasSettled: input => {
        const cached = get().queryCache[`:${trackInput(input)}`];
        return cached?.lastFetchedAt != null || cached?.errorInfo != null;
      },

      load: async input => {
        await get().fetch({ inputs: [input], refresh: false, retained: true }, { force: true, throwOnError: true });
        return get().get(input);
      },

      refresh: async input => {
        await get().fetch({ inputs: [input], refresh: true, retained: true }, { force: true, throwOnError: true });
        return get().get(input);
      },
    }),

    persistence
      ? {
          ...persistence,
          partialize: () => EMPTY_CUSTOM_STATE,
          merge: (saved, current) => {
            const queryCache: State<Input, Data>['queryCache'] = {};
            for (const key in saved?.queryCache) {
              const cached = saved.queryCache[key];
              if (key.startsWith(':') && cached?.lastFetchedAt != null) queryCache[key] = { ...cached, errorInfo: null };
            }
            return { ...current, queryCache };
          },
        }
      : undefined
  );

  const reset = store.getState().reset;
  store.setState({
    reset: resetState => {
      destroyed = true;
      for (const key in requests) requests[key]?.controller.abort();
      reset(resetState);
    },
  });

  function trackInput(input: Input): Key {
    const key = getKey(input);
    if (readTracker.track(key)) inputsByKey[key] = input;
    return key;
  }

  function request(input: Input, retained: boolean): Request<Data> {
    const key = getKey(input);
    const active = requests[key];

    if (active && !active.controller.signal.aborted) {
      active.retained ||= retained;
      return active;
    }

    const controller = new AbortController();
    const current: Request<Data> = {
      controller,
      retained,
      promise: Promise.resolve().then(() => {
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
      store.setState(s => ({ queryCache: { ...s.queryCache, [`:${key}`]: entry } }));
    }
  }

  async function fetchMembers({ inputs, refresh, retained }: Params<Input>, controller: AbortController | null): Promise<Results<Data>> {
    const queryCache = store.getState().queryCache;
    const staleCutoff = Date.now() - staleTime;
    const staleInputs = refresh
      ? inputs
      : inputs.filter(input => {
          const cached = queryCache[`:${getKey(input)}`];
          return !cached?.lastFetchedAt || cached.errorInfo != null || cached.lastFetchedAt <= staleCutoff;
        });

    const members = staleInputs.map(input => request(input, retained || controller === null));
    const cancelUnused = (): void => {
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        if (!member.retained && (!store.getState().enabled || !demandedKeys.includes(getKey(staleInputs[i])))) member.controller.abort();
      }
    };

    controller?.signal.addEventListener('abort', cancelUnused, { once: true });
    const settled = await Promise.allSettled(members.map(member => member.promise));
    controller?.signal.removeEventListener('abort', cancelUnused);

    if (settled.length && settled.every(result => result.status === 'rejected')) throw settled[0].reason;
    return {};
  }

  function batchEntry(inputs: Input[], queryCache: State<Input, Data>['queryCache']): CacheEntry<Results<Data>> {
    let lastFetchedAt = Date.now();
    for (const input of inputs) {
      const cached = queryCache[`:${getKey(input)}`];
      lastFetchedAt = Math.min(lastFetchedAt, Math.max(cached?.lastFetchedAt ?? 0, cached?.errorInfo?.lastFailedAt ?? 0));
    }
    return { data: null, lastFetchedAt, cacheTime: 0, errorInfo: null };
  }

  function updateDemand(): void {
    demandUpdatePending = false;
    if (destroyed) return;

    const inputs: Input[] = [];
    const nextInputs: Record<Key, Input> = nullObject();

    for (const key of demandedKeys) {
      const input = inputsByKey[key];
      inputs.push(input);
      nextInputs[key] = input;
    }

    inputsByKey = nextInputs;
    for (const key in requests) {
      const active = requests[key];
      if (active && !active.retained && !(key in nextInputs)) active.controller.abort();
    }

    store.setState(s => {
      const queryCache = { ...s.queryCache };
      delete queryCache[s.queryKey];
      const queryKey = getQueryKey({ inputs: demandedKeys, retained: false });
      delete queryCache[queryKey];

      if (inputs.length && inputs.every(input => queryCache[`:${getKey(input)}`]?.errorInfo == null)) {
        queryCache[queryKey] = batchEntry(inputs, queryCache);
      }
      return { inputs, queryCache };
    });
  }

  return readTracker.install(store, keys => {
    demandedKeys = keys.sort();
    if (demandUpdatePending) return;
    demandUpdatePending = true;
    queueMicrotask(updateDemand);
  });
}
