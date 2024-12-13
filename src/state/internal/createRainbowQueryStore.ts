import { StateCreator, StoreApi, UseBoundStore, create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { IS_DEV } from '@/env';
import { logger, RainbowError } from '@/logger';
import { createRainbowStore, RainbowPersistConfig } from './createRainbowStore';

/**
 * Represents the status of the remote data fetching process.
 */
type RemoteStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Configuration options for remote data fetching.
 */
interface FetchOptions {
  cacheTime?: number;
  force?: boolean;
  staleTime?: number;
}

/**
 * Represents a cached query result.
 */
interface CacheEntry<TData> {
  data: TData;
  lastFetchedAt: number;
}

/**
 * The base store state including query-related fields and actions.
 */
type StoreState<TData, TParams extends Record<string, unknown>> = {
  data: TData | null;
  enabled: boolean;
  error: Error | null;
  lastFetchedAt: number | null;
  queryCache: Record<string, CacheEntry<TData>>;
  status: RemoteStatus;
  subscriptionCount: number;
  fetch: (params?: TParams, options?: FetchOptions) => Promise<void>;
  isDataExpired: (cacheTimeOverride?: number) => boolean;
  isStale: (staleTimeOverride?: number) => boolean;
  reset: () => void;
};

/**
 * The keys that make up the internal state of the store.
 */
type InternalStateKey = keyof StoreState<unknown, Record<string, unknown>>;

/**
 * A specialized store interface combining Zustand's store API with remote fetching.
 */
export interface QueryStore<TData, TParams extends Record<string, unknown>, S extends StoreState<TData, TParams>>
  extends UseBoundStore<StoreApi<S>> {
  enabled: boolean;
  fetch: (params?: TParams, options?: FetchOptions) => Promise<void>;
  isDataExpired: (override?: number) => boolean;
  isStale: (override?: number) => boolean;
  reset: () => void;
}

/**
 * Configuration options for creating a remote-enabled Rainbow store.
 */
type RainbowQueryStoreConfig<TQueryFnData, TParams extends Record<string, unknown>, TData, S extends StoreState<TData, TParams>> = {
  fetcher: (params: TParams) => TQueryFnData | Promise<TQueryFnData>;
  onFetched?: (data: TData, store: QueryStore<TData, TParams, S>) => void;
  transform?: (data: TQueryFnData) => TData;
  cacheTime?: number;
  defaultParams?: TParams;
  disableDataCache?: boolean;
  enabled?: boolean;
  queryKey: readonly unknown[] | ((params: TParams) => readonly unknown[]);
  staleTime?: number;
};

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;
const TWO_MINUTES = 1000 * 60 * 2;
const FIVE_SECONDS = 1000 * 5;
const MIN_STALE_TIME = FIVE_SECONDS;

const DISCARDABLE_INTERNAL_STATE: InternalStateKey[] = ['fetch', 'isDataExpired', 'isStale', 'reset', 'subscriptionCount'];

/**
 * Creates a remote-enabled Rainbow store with data fetching capabilities.
 * @template TQueryFnData - The raw data type returned by the fetcher
 * @template TParams - Parameters passed to the fetcher function
 * @template TData - The transformed data type (defaults to TQueryFnData)
 * @template U - Additional user-defined state
 */
export function createRainbowQueryStore<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, unknown>,
  U = unknown,
  TData = TQueryFnData,
>(
  config: RainbowQueryStoreConfig<TQueryFnData, TParams, TData, StoreState<TData, TParams> & U>,
  customStateCreator?: StateCreator<U, [], [['zustand/subscribeWithSelector', never]]>,
  persistConfig?: RainbowPersistConfig<StoreState<TData, TParams> & U>
): QueryStore<TData, TParams, StoreState<TData, TParams> & U> {
  type S = StoreState<TData, TParams> & U;

  const {
    fetcher,
    onFetched,
    transform,
    cacheTime = SEVEN_DAYS,
    defaultParams,
    disableDataCache = true,
    enabled = true,
    queryKey,
    staleTime = TWO_MINUTES,
  } = config;

  if (IS_DEV && staleTime < MIN_STALE_TIME) {
    console.warn(
      `[RainbowQueryStore${persistConfig?.storageKey ? `: ${persistConfig.storageKey}` : ''}] ❌ Stale times under ${MIN_STALE_TIME / 1000} seconds are not recommended.`
    );
  }

  let activeFetchPromise: Promise<void> | null = null;
  let activeRefetchTimeout: NodeJS.Timeout | null = null;
  let lastFetchKey: string | null = null;

  const getQueryKey = (params: TParams): string => {
    const key = typeof queryKey === 'function' ? queryKey(params) : queryKey;
    return JSON.stringify(key);
  };

  const initialData = {
    data: null,
    enabled,
    error: null,
    lastFetchedAt: null,
    queryCache: {},
    status: 'idle' as const,
    subscriptionCount: 0,
  };

  const createState: StateCreator<S, [], [['zustand/subscribeWithSelector', never]]> = (set, get, api) => {
    let isRefetchScheduled = false;

    const pruneCache = (state: S): S => {
      if (disableDataCache) return state;
      const now = Date.now();
      const newCache: Record<string, CacheEntry<TData>> = {};
      Object.entries(state.queryCache).forEach(([key, entry]) => {
        if (now - entry.lastFetchedAt <= cacheTime) {
          newCache[key] = entry;
        }
      });
      return { ...state, queryCache: newCache };
    };

    const scheduleNextFetch = (params: TParams) => {
      if (isRefetchScheduled || staleTime <= 0) return;
      if (activeRefetchTimeout) clearTimeout(activeRefetchTimeout);

      isRefetchScheduled = true;
      activeRefetchTimeout = setTimeout(() => {
        isRefetchScheduled = false;
        if (get().subscriptionCount > 0) {
          get().fetch(params, { force: true });
        }
      }, staleTime);
    };

    const baseMethods = {
      async fetch(params: TParams | undefined, options: FetchOptions | undefined) {
        if (!get().enabled) return;

        const effectiveParams = params ?? defaultParams ?? ({} as TParams);
        const currentQueryKey = getQueryKey(effectiveParams);

        if (activeFetchPromise && lastFetchKey === currentQueryKey && get().status === 'loading' && !options?.force) {
          return activeFetchPromise;
        }

        if (!options?.force && !disableDataCache) {
          const cached = get().queryCache[currentQueryKey];
          if (cached && Date.now() - cached.lastFetchedAt <= (options?.staleTime ?? staleTime)) {
            set(state => ({ ...state, data: cached.data }));
            return;
          }
        }

        set(state => ({ ...state, error: null, status: 'loading' }));
        lastFetchKey = currentQueryKey;

        const fetchOperation = async () => {
          try {
            const result = await fetcher(effectiveParams);
            const rawData = result instanceof Promise ? await result : result;
            const transformedData = transform ? transform(rawData) : (rawData as TData);

            set(state => {
              const newState = {
                ...state,
                error: null,
                lastFetchedAt: Date.now(),
                status: 'success' as const,
              };

              if (!disableDataCache) {
                newState.queryCache = {
                  ...newState.queryCache,
                  [currentQueryKey]: {
                    data: transformedData,
                    lastFetchedAt: Date.now(),
                  },
                };
              }

              if (!onFetched) newState.data = transformedData;

              return pruneCache(newState);
            });

            scheduleNextFetch(effectiveParams);

            if (onFetched) {
              onFetched(transformedData, queryCapableStore);
            }
          } catch (error) {
            logger.error(
              new RainbowError(`[createRainbowQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: Failed to fetch data`),
              { error }
            );
            // TODO: Improve retry logic
            set(state => ({ ...state, error, status: 'error' as const }));
            scheduleNextFetch(effectiveParams);
          } finally {
            activeFetchPromise = null;
            lastFetchKey = null;
          }
        };

        activeFetchPromise = fetchOperation();
        return activeFetchPromise;
      },

      isStale(staleTimeOverride?: number) {
        const { lastFetchedAt } = get();
        const effectiveStaleTime = staleTimeOverride ?? staleTime;
        if (lastFetchedAt === null) return true;
        return Date.now() - lastFetchedAt > effectiveStaleTime;
      },

      isDataExpired(cacheTimeOverride?: number) {
        const { lastFetchedAt } = get();
        const effectiveCacheTime = cacheTimeOverride ?? cacheTime;
        if (lastFetchedAt === null) return true;
        return Date.now() - lastFetchedAt > effectiveCacheTime;
      },

      reset() {
        if (activeRefetchTimeout) {
          clearTimeout(activeRefetchTimeout);
          activeRefetchTimeout = null;
        }
        activeFetchPromise = null;
        lastFetchKey = null;
        isRefetchScheduled = false;
        set(state => ({ ...state, ...initialData }));
      },
    };

    // If customStateCreator is provided, it will return user-defined fields (U)
    const userState = customStateCreator?.(set, get, api) ?? ({} as U);

    const subscribeWithSelector = api.subscribe;
    api.subscribe = (listener: (state: S, prevState: S) => void) => {
      set(prev => ({ ...prev, subscriptionCount: prev.subscriptionCount + 1 }));
      const unsubscribe = subscribeWithSelector(listener);

      const handleSetEnabled = subscribeWithSelector((state: S, prev: S) => {
        if (state.enabled !== prev.enabled) {
          if (state.enabled) {
            if (!state.data || state.isStale()) {
              state.fetch(defaultParams);
            } else {
              scheduleNextFetch(defaultParams ?? ({} as TParams));
            }
          } else {
            if (activeRefetchTimeout) {
              clearTimeout(activeRefetchTimeout);
              activeRefetchTimeout = null;
            }
            isRefetchScheduled = false;
          }
        }
      });

      const { data, fetch, isStale } = get();

      if (!data || isStale()) {
        fetch(defaultParams, { force: true });
      } else {
        scheduleNextFetch(defaultParams ?? ({} as TParams));
      }

      return () => {
        handleSetEnabled();
        unsubscribe();
        set(prev => {
          const newCount = Math.max(prev.subscriptionCount - 1, 0);
          if (newCount === 0) {
            if (activeRefetchTimeout) {
              clearTimeout(activeRefetchTimeout);
              activeRefetchTimeout = null;
            }
            isRefetchScheduled = false;
          }
          return { ...prev, subscriptionCount: newCount };
        });
      };
    };

    // Merge base data, user state, and methods into the final store state
    return {
      ...initialData,
      ...userState,
      ...baseMethods,
    };
  };

  const combinedPersistConfig = persistConfig
    ? {
        ...persistConfig,
        partialize: createBlendedPartialize(persistConfig.partialize),
      }
    : undefined;

  const baseStore = persistConfig?.storageKey
    ? createRainbowStore<StoreState<TData, TParams> & U>(createState, combinedPersistConfig)
    : create<StoreState<TData, TParams> & U>()(subscribeWithSelector(createState));

  const queryCapableStore: QueryStore<TData, TParams, S> = Object.assign(baseStore, {
    fetch: (params?: TParams, options?: FetchOptions) => baseStore.getState().fetch(params, options),
    isDataExpired: (override?: number) => baseStore.getState().isDataExpired(override),
    isStale: (override?: number) => baseStore.getState().isStale(override),
    reset: () => baseStore.getState().reset(),
    enabled,
  });

  return queryCapableStore;
}

/**
 * Checks whether a state key is internal and should be discarded from persistence.
 */
function shouldDiscardInternalState(key: InternalStateKey | string): key is InternalStateKey {
  return DISCARDABLE_INTERNAL_STATE.includes(key as InternalStateKey);
}

/**
 * Creates a combined partialize function that ensures internal query state is always
 * persisted while respecting user-defined persistence preferences.
 */
function createBlendedPartialize<TData, TParams extends Record<string, unknown>, S extends StoreState<TData, TParams> & U, U = unknown>(
  userPartialize: ((state: StoreState<TData, TParams> & U) => Partial<StoreState<TData, TParams> & U>) | undefined
) {
  return (state: S) => {
    const internalStateToPersist = {
      data: state.data,
      enabled: state.enabled,
      error: state.error,
      lastFetchedAt: state.lastFetchedAt,
      queryCache: state.queryCache,
      status: state.status,
    };

    for (const key in state) {
      if (shouldDiscardInternalState(key)) delete state[key];
    }

    return {
      ...(userPartialize ? userPartialize(state) : state),
      ...internalStateToPersist,
    };
  };
}
