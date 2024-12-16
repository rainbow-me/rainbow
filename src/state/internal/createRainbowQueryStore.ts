import { StateCreator, StoreApi, UseBoundStore, create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { IS_DEV } from '@/env';
import { logger, RainbowError } from '@/logger';
import { createRainbowStore, RainbowPersistConfig } from './createRainbowStore';
import { $, AttachValue, attachValueSubscriptionMap, SignalFunction, Unsubscribe } from './signal';

const ENABLE_LOGS = false;

export const QueryStatuses = {
  Idle: 'idle',
  Loading: 'loading',
  Success: 'success',
  Error: 'error',
} as const;

/**
 * Represents the status of the remote data fetching process.
 */
export type QueryStatus = (typeof QueryStatuses)[keyof typeof QueryStatuses];

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
 * A specialized store interface combining Zustand's store API with remote fetching.
 */
export interface QueryStore<TData, TParams extends Record<string, unknown>, S extends StoreState<TData, TParams>>
  extends UseBoundStore<StoreApi<S>> {
  enabled: boolean;
  destroy: () => void;
  fetch: (params?: TParams, options?: FetchOptions) => Promise<void>;
  isDataExpired: (override?: number) => boolean;
  isStale: (override?: number) => boolean;
  reset: () => void;
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
  status: QueryStatus;
  subscriptionCount: number;
  fetch: (params?: TParams, options?: FetchOptions) => Promise<void>;
  isDataExpired: (cacheTimeOverride?: number) => boolean;
  isStale: (staleTimeOverride?: number) => boolean;
  reset: () => void;
};

/**
 * Configuration options for creating a remote-enabled Rainbow store.
 */
type RainbowQueryStoreConfig<TQueryFnData, TParams extends Record<string, unknown>, TData, S extends StoreState<TData, TParams>> = {
  fetcher: (params: TParams) => TQueryFnData | Promise<TQueryFnData>;
  onFetched?: (data: TData, store: QueryStore<TData, TParams, S>) => void;
  transform?: (data: TQueryFnData) => TData;
  cacheTime?: number;
  params?: {
    [K in keyof TParams]: ParamResolvable<TParams[K]>;
  };
  disableDataCache?: boolean;
  enabled?: boolean;
  staleTime?: number;
};

/**
 * A function that resolves to a value or an AttachValue wrapper.
 */
type ParamResolvable<T> = T | ((resolve: SignalFunction) => AttachValue<T>);

/**
 * The result of resolving parameters into their direct values and AttachValue wrappers.
 */
interface ResolvedParamsResult<TParams> {
  directValues: Partial<TParams>;
  paramAttachVals: Partial<Record<keyof TParams, AttachValue<unknown>>>;
  resolvedParams: TParams;
}

/**
 * The keys that make up the internal state of the store.
 */
type InternalStateKeys = keyof StoreState<unknown, Record<string, unknown>>;

const [persist, discard] = [true, false];

const SHOULD_PERSIST_INTERNAL_STATE_MAP: Record<string, boolean> = {
  /* Internal state to persist if the store is persisted */
  data: persist,
  enabled: persist,
  error: persist,
  lastFetchedAt: persist,
  queryCache: persist,
  status: persist,

  /* Internal state and methods to discard */
  fetch: discard,
  isDataExpired: discard,
  isStale: discard,
  reset: discard,
  subscriptionCount: discard,
} satisfies Record<InternalStateKeys, boolean>;

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;
const TWO_MINUTES = 1000 * 60 * 2;
const FIVE_SECONDS = 1000 * 5;
const MIN_STALE_TIME = FIVE_SECONDS;

export function createRainbowQueryStore<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, unknown>,
  U = unknown,
  TData = TQueryFnData,
>(
  config: RainbowQueryStoreConfig<TQueryFnData, TParams, TData, StoreState<TData, TParams> & U> & {
    params?: {
      [K in keyof TParams]: ParamResolvable<TParams[K]>;
    };
  },
  customStateCreator?: StateCreator<U, [], [['zustand/subscribeWithSelector', never]]>,
  persistConfig?: RainbowPersistConfig<StoreState<TData, TParams> & U>
): QueryStore<TData, TParams, StoreState<TData, TParams> & U> {
  type S = StoreState<TData, TParams> & U;

  const {
    fetcher,
    onFetched,
    transform,
    cacheTime = SEVEN_DAYS,
    params,
    disableDataCache = true,
    enabled = true,
    staleTime = TWO_MINUTES,
  } = config;

  let paramAttachVals: Partial<Record<keyof TParams, AttachValue<unknown>>> = {};
  let directValues: Partial<TParams> = {};

  if (params) {
    const result = resolveParams<TParams>(params);
    paramAttachVals = result.paramAttachVals;
    directValues = result.directValues;
  }

  if (IS_DEV && staleTime < MIN_STALE_TIME) {
    console.warn(
      `[RainbowQueryStore${persistConfig?.storageKey ? `: ${persistConfig.storageKey}` : ''}] ❌ Stale times under ${
        MIN_STALE_TIME / 1000
      } seconds are not recommended.`
    );
  }

  let activeFetchPromise: Promise<void> | null = null;
  let activeRefetchTimeout: NodeJS.Timeout | null = null;
  let lastFetchKey: string | null = null;

  const initialData = {
    data: null,
    enabled,
    error: null,
    lastFetchedAt: null,
    queryCache: {},
    status: 'idle' as const,
    subscriptionCount: 0,
  };

  const getQueryKey = (params: TParams): string => JSON.stringify(Object.values(params));

  const getCurrentResolvedParams = () => {
    const currentParams = { ...directValues };
    for (const k in paramAttachVals) {
      const attachVal = paramAttachVals[k as keyof TParams];
      if (!attachVal) continue;
      currentParams[k as keyof TParams] = attachVal.value as TParams[keyof TParams];
    }
    return currentParams as TParams;
  };

  const scheduleNextFetch = (params: TParams) => {
    if (staleTime <= 0) return;
    if (activeRefetchTimeout) {
      clearTimeout(activeRefetchTimeout);
      activeRefetchTimeout = null;
    }
    activeRefetchTimeout = setTimeout(() => {
      if (baseStore.getState().subscriptionCount > 0) {
        baseStore.getState().fetch(params, { force: true });
      }
    }, staleTime);
  };

  const createState: StateCreator<S, [], [['zustand/subscribeWithSelector', never]]> = (set, get, api) => {
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

    const baseMethods = {
      async fetch(params: TParams | undefined, options: FetchOptions | undefined) {
        if (!get().enabled) return;
        const effectiveParams = params ?? getCurrentResolvedParams();
        const currentQueryKey = getQueryKey(effectiveParams);
        const isLoading = get().status === 'loading';

        if (activeFetchPromise && lastFetchKey === currentQueryKey && isLoading && !options?.force) {
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
            const rawResult = await fetcher(effectiveParams);
            let transformedData: TData;
            try {
              transformedData = transform ? transform(rawResult) : (rawResult as TData);
            } catch (transformError) {
              throw new RainbowError(`[createRainbowQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: transform failed`, {
                cause: transformError,
              });
            }

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
              try {
                onFetched(transformedData, queryCapableStore);
              } catch (onFetchedError) {
                logger.error(
                  new RainbowError(
                    `[createRainbowQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: onFetched callback failed`,
                    { cause: onFetchedError }
                  )
                );
              }
            }
          } catch (error) {
            logger.error(
              new RainbowError(`[createRainbowQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: Failed to fetch data`),
              { error }
            );
            set(state => ({ ...state, error: error as Error, status: 'error' as const }));
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
        set(state => ({ ...state, ...initialData }));
      },
    };

    const userState = customStateCreator?.(set, get, api) ?? ({} as U);

    const subscribeWithSelector = api.subscribe;
    api.subscribe = (listener: (state: S, prevState: S) => void) => {
      set(prev => ({ ...prev, subscriptionCount: prev.subscriptionCount + 1 }));
      const unsubscribe = subscribeWithSelector(listener);

      const handleSetEnabled = subscribeWithSelector((state: S, prev: S) => {
        if (state.enabled !== prev.enabled) {
          if (state.enabled) {
            const currentKey = getQueryKey(getCurrentResolvedParams());
            if (currentKey !== lastFetchKey) {
              state.fetch(getCurrentResolvedParams(), { force: true });
            } else if (!state.data || state.isStale()) {
              state.fetch();
            } else {
              scheduleNextFetch(getCurrentResolvedParams());
            }
          } else {
            if (activeRefetchTimeout) {
              clearTimeout(activeRefetchTimeout);
              activeRefetchTimeout = null;
            }
          }
        }
      });

      const { data, fetch, isStale } = get();

      if (!data || isStale()) {
        fetch(getCurrentResolvedParams(), { force: true });
      } else {
        scheduleNextFetch(getCurrentResolvedParams());
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
    destroy: () => {
      for (const unsub of paramUnsubscribes) {
        unsub();
      }
      paramUnsubscribes.length = 0;
      queryCapableStore.getState().reset();
    },
  });

  const onParamChange = () => {
    const newParams = getCurrentResolvedParams();
    queryCapableStore.fetch(newParams, { force: true });
  };

  const paramUnsubscribes: Unsubscribe[] = [];

  for (const k in paramAttachVals) {
    const attachVal = paramAttachVals[k];
    if (!attachVal) continue;

    const subscribeFn = attachValueSubscriptionMap.get(attachVal);
    if (ENABLE_LOGS) console.log('[🌀 ParamSubscription 🌀] Subscribed to param:', k);

    if (subscribeFn) {
      let oldVal = attachVal.value;
      const unsub = subscribeFn(() => {
        const newVal = attachVal.value;
        if (!Object.is(oldVal, newVal)) {
          oldVal = newVal;
          if (ENABLE_LOGS) console.log('[🌀 ParamChange 🌀] Param changed:', k);
          onParamChange();
        }
      });
      paramUnsubscribes.push(unsub);
    }
  }

  return queryCapableStore;
}

function isParamFn<T>(param: T | ((resolve: SignalFunction) => AttachValue<T>)): param is (resolve: SignalFunction) => AttachValue<T> {
  return typeof param === 'function';
}

function resolveParams<TParams extends Record<string, unknown>>(params: {
  [K in keyof TParams]: ParamResolvable<TParams[K]>;
}): ResolvedParamsResult<TParams> {
  const resolvedParams = {} as TParams;
  const paramAttachVals: Partial<Record<keyof TParams, AttachValue<unknown>>> = {};
  const directValues: Partial<TParams> = {};

  for (const key in params) {
    const param = params[key];
    if (isParamFn(param)) {
      const attachVal = param($);
      resolvedParams[key] = attachVal.value as TParams[typeof key];
      paramAttachVals[key] = attachVal;
    } else {
      resolvedParams[key] = param as TParams[typeof key];
      directValues[key] = param as TParams[typeof key];
    }
  }

  return { resolvedParams, paramAttachVals, directValues };
}

function createBlendedPartialize<TData, TParams extends Record<string, unknown>, S extends StoreState<TData, TParams> & U, U = unknown>(
  userPartialize: ((state: StoreState<TData, TParams> & U) => Partial<StoreState<TData, TParams> & U>) | undefined
) {
  return (state: S) => {
    const clonedState = { ...state };
    const internalStateToPersist: Partial<S> = {};

    for (const key in clonedState) {
      if (key in SHOULD_PERSIST_INTERNAL_STATE_MAP) {
        if (SHOULD_PERSIST_INTERNAL_STATE_MAP[key]) internalStateToPersist[key] = clonedState[key];
        delete clonedState[key];
      }
    }

    return {
      ...(userPartialize ? userPartialize(clonedState) : clonedState),
      ...internalStateToPersist,
    } satisfies Partial<S>;
  };
}
