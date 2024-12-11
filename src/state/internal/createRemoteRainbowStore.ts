/* eslint-disable @typescript-eslint/no-explicit-any */

import { StateCreator, StoreApi, UseBoundStore, create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
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
 * The base store state including remote fields and actions.
 */
type StoreState<TData, TParams extends Record<string, any>> = {
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
 * A specialized store interface combining Zustand's store API with remote fetching.
 */
export interface RemoteStore<TData, TParams extends Record<string, any>, S extends StoreState<TData, TParams>>
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
type RemoteRainbowStoreConfig<TQueryFnData, TParams extends Record<string, any>, TData, S extends StoreState<TData, TParams>> = {
  cacheTime?: number;
  defaultParams?: TParams;
  disableDataCache?: boolean;
  enabled?: boolean;
  queryKey: readonly unknown[] | ((params: TParams) => readonly unknown[]);
  staleTime?: number;
  fetcher: (params: TParams) => TQueryFnData | Promise<TQueryFnData>;
  onFetched?: (data: TData, store: RemoteStore<TData, TParams, S>) => void;
  transform?: (data: TQueryFnData) => TData;
};

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;
const TWO_MINUTES = 1000 * 60 * 2;

/**
 * Creates a remote-enabled Rainbow store with data fetching capabilities.
 *
 * We use a `U` generic to represent user-defined additional state, and then define:
 * S = StoreState<TData, TParams> & U
 *
 * This ensures that the base fields are always present, and user-added fields are merged in.
 */
export function createRemoteRainbowStore<
  TQueryFnData,
  TParams extends Record<string, any> = Record<string, any>,
  U = unknown,
  TData = TQueryFnData,
>(
  config: RemoteRainbowStoreConfig<TQueryFnData, TParams, TData, StoreState<TData, TParams> & U>,
  customStateCreator?: StateCreator<U, [], [['zustand/subscribeWithSelector', never]]>,
  persistConfig?: RainbowPersistConfig<StoreState<TData, TParams> & U>
): RemoteStore<TData, TParams, StoreState<TData, TParams> & U> {
  type S = StoreState<TData, TParams> & U;

  const {
    cacheTime = SEVEN_DAYS,
    defaultParams,
    disableDataCache = true,
    enabled = true,
    queryKey,
    staleTime = TWO_MINUTES,
    fetcher,
    onFetched,
    transform,
  } = config;

  let activeFetchPromise: Promise<void> | null = null;
  let activeRefetchTimeout: NodeJS.Timeout | null = null;
  let lastFetchKey: string | null = null;

  const getQueryKey = (params: TParams): string => {
    const key = typeof queryKey === 'function' ? queryKey(params) : queryKey;
    return JSON.stringify(key);
  };

  const initialData: Omit<S, 'fetch' | 'isStale' | 'isDataExpired' | 'reset'> = {
    data: null,
    enabled,
    error: null,
    lastFetchedAt: null,
    queryCache: {},
    status: 'idle',
    subscriptionCount: 0,
  } as unknown as Omit<S, 'fetch' | 'isStale' | 'isDataExpired' | 'reset'>;

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
        const store = get();
        if (store.subscriptionCount > 0) {
          store.fetch(params, { force: true });
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
          const currentState = get();
          const cached = currentState.queryCache[currentQueryKey];
          if (cached && Date.now() - cached.lastFetchedAt <= (options?.staleTime ?? staleTime)) {
            set(state => ({ ...state, data: cached.data }));
            return;
          }
        }

        set(state => ({ ...state, status: 'loading', error: null }));
        lastFetchKey = currentQueryKey;

        const fetchOperation = async () => {
          try {
            const rawData = await fetcher(effectiveParams);
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
              onFetched(transformedData, remoteCapableStore);
            }
          } catch (error: any) {
            console.log('[ERROR]:', error);
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
        set(initialData as Partial<S> as S);
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

      const currentState = get();
      if (!currentState.data || currentState.isStale()) {
        currentState.fetch(defaultParams, { force: true });
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
    } satisfies S;
  };

  const baseStore = persistConfig?.storageKey
    ? createRainbowStore<StoreState<TData, TParams> & U>(createState, persistConfig)
    : create<StoreState<TData, TParams> & U>()(subscribeWithSelector(createState));

  const remoteCapableStore: RemoteStore<TData, TParams, S> = Object.assign(baseStore, {
    enabled,
    fetch: (params?: TParams, options?: FetchOptions) => baseStore.getState().fetch(params, options),
    isDataExpired: (override?: number) => baseStore.getState().isDataExpired(override),
    isStale: (override?: number) => baseStore.getState().isStale(override),
    reset: () => baseStore.getState().reset(),
  });

  return remoteCapableStore;
}
