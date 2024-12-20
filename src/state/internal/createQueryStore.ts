import { StateCreator, StoreApi, UseBoundStore, create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { IS_DEV } from '@/env';
import { RainbowError, logger } from '@/logger';
import { RainbowPersistConfig, createRainbowStore, omitStoreMethods } from './createRainbowStore';
import { $, AttachValue, SignalFunction, Unsubscribe, attachValueSubscriptionMap } from './signal';

const ENABLE_LOGS = false;

/**
 * A set of constants representing the various stages of a query's remote data fetching process.
 */
export const QueryStatuses = {
  Error: 'error',
  Idle: 'idle',
  Loading: 'loading',
  Success: 'success',
} as const;

/**
 * Represents the current status of the query's remote data fetching operation.
 *
 * Possible values:
 * - **`'error'`**  : The most recent request encountered an error.
 * - **`'idle'`**   : No request in progress, no error, no data yet.
 * - **`'loading'`** : A request is currently in progress.
 * - **`'success'`** : The most recent request has succeeded, and `data` is available.
 */
export type QueryStatus = (typeof QueryStatuses)[keyof typeof QueryStatuses];

/**
 * Expanded status information for the currently specified query parameters.
 */
export type QueryStatusInfo = {
  isError: boolean;
  isFetching: boolean;
  isIdle: boolean;
  isInitialLoading: boolean;
  isSuccess: boolean;
};

/**
 * Defines additional options for a data fetch operation.
 */
interface FetchOptions {
  /**
   * Overrides the default cache duration for this fetch, in milliseconds.
   * If data in the cache is older than this duration, it will be considered expired and
   * will be pruned following a successful fetch.
   */
  cacheTime?: number;
  /**
   * Forces a fetch request even if the current data is fresh and not stale.
   * If `true`, the fetch operation bypasses existing cached data.
   */
  force?: boolean;
  /**
   * Overrides the default stale duration for this fetch, in milliseconds.
   * If the fetch is successful, the subsequently scheduled refetch will occur after
   * the specified duration.
   */
  staleTime?: number;
}

/**
 * Represents an entry in the query cache, which stores fetched data along with metadata, and error information
 * in the event the most recent fetch failed.
 */
interface CacheEntry<TData> {
  data: TData | null;
  errorInfo: {
    error: Error;
    lastFailedAt: number;
    retryCount: number;
  } | null;
  lastFetchedAt: number;
}

/**
 * A specialized store interface that combines Zustand's store capabilities with remote data fetching support.
 *
 * In addition to Zustand's store API (such as `getState()` and `subscribe()`), this interface provides:
 * - **`enabled`**: A boolean indicating if the store is actively fetching data.
 * - **`fetch(params, options)`**: Initiates a data fetch operation.
 * - **`getData(params)`**: Returns the cached data, if available, for the current query parameters.
 * - **`getStatus()`**: Returns expanded status information for the current query parameters.
 * - **`isDataExpired(override?)`**: Checks if the current data has expired based on `cacheTime`.
 * - **`isStale(override?)`**: Checks if the current data is stale based on `staleTime`.
 * - **`reset()`**: Resets the store to its initial state, clearing data and errors.
 */
export interface QueryStore<
  TData,
  TParams extends Record<string, unknown>,
  S extends Omit<StoreState<TData, TParams>, keyof PrivateStoreState>,
> extends UseBoundStore<StoreApi<S>> {
  /**
   * Indicates whether the store should actively fetch data.
   * When `false`, the store won't automatically refetch data.
   */
  enabled: boolean;
  /**
   * Initiates a data fetch for the given parameters. If no parameters are provided, the store's
   * current parameters are used.
   * @param params - Optional parameters to pass to the fetcher function.
   * @param options - Optional {@link FetchOptions} to customize the fetch behavior.
   * @returns A promise that resolves when the fetch operation completes.
   */
  fetch: (params?: TParams, options?: FetchOptions) => Promise<void>;
  /**
   * Returns the cached data, if available, for the current query params.
   * @returns The cached data, or `null` if no data is available.
   */
  getData: (params?: TParams) => TData | null;
  /**
   * Returns expanded status information for the currently specified query parameters. The raw
   * status can be obtained by directly reading the `status` property.
   * @example
   * ```ts
   * const isInitialLoad = useQueryStore(state => state.getStatus().isInitialLoad);
   * ```
   * @returns An object containing boolean flags for each status.
   */
  getStatus: () => QueryStatusInfo;
  /**
   * Determines if the current data is expired based on whether `cacheTime` has been exceeded.
   * @param override - An optional override for the default cache time, in milliseconds.
   * @returns `true` if the data is expired, otherwise `false`.
   */
  isDataExpired: (override?: number) => boolean;
  /**
   * Determines if the current data is stale based on whether `staleTime` has been exceeded.
   * Stale data may be refreshed automatically in the background.
   * @param override - An optional override for the default stale time, in milliseconds.
   * @returns `true` if the data is stale, otherwise `false`.
   */
  isStale: (override?: number) => boolean;
  /**
   * Resets the store to its initial state, clearing data, error, and any cached values.
   */
  reset: () => void;
}

/**
 * The private state managed by the query store, omitted from the store's public interface.
 */
type PrivateStoreState = {
  subscriptionCount: number;
};

/**
 * The full state structure managed by the query store. This type is generally internal,
 * though the state it defines can be accessed via the store's public interface.
 */
type StoreState<TData, TParams extends Record<string, unknown>> = Pick<
  QueryStore<TData, TParams, StoreState<TData, TParams>>,
  'enabled' | 'fetch' | 'getData' | 'getStatus' | 'isDataExpired' | 'isStale' | 'reset'
> & {
  error: Error | null;
  lastFetchedAt: number | null;
  queryCache: Record<string, CacheEntry<TData> | undefined>;
  status: QueryStatus;
};

/**
 * Configuration options for creating a query-enabled Rainbow store.
 */
export type RainbowQueryStoreConfig<TQueryFnData, TParams extends Record<string, unknown>, TData, S extends StoreState<TData, TParams>> = {
  /**
   * A function responsible for fetching data from a remote source.
   * Receives parameters of type `TParams` and returns either a promise or a raw data value of type `TQueryFnData`.
   */
  fetcher: (params: TParams) => TQueryFnData | Promise<TQueryFnData>;
  /**
   * The maximum number of times to retry a failed fetch operation.
   * @default 3
   */
  maxRetries?: number;
  /**
   * The delay between retries after a fetch error occurs, in milliseconds, defined as a number or a function that
   * receives the error and current retry count and returns a number.
   * @default time.seconds(5)
   */
  retryDelay?: number | ((retryCount: number, error: Error) => number);
  /**
   * A callback invoked whenever a fetch operation fails.
   * Receives the error and the current retry count.
   */
  onError?: (error: Error, retryCount: number) => void;
  /**
   * A callback invoked whenever fresh data is successfully fetched.
   * Receives the transformed data and the store's set function, which can optionally be used to update store state.
   */
  onFetched?: (data: TData, set: (partial: S | Partial<S> | ((state: S) => S | Partial<S>)) => void) => void;
  /**
   * A function that overrides the default behavior of setting the fetched data in the store's query cache.
   * Receives the transformed data and the store's set function.
   */
  setData?: (data: TData, set: (partial: S | Partial<S> | ((state: S) => S | Partial<S>)) => void) => void;
  /**
   * Suppresses warnings in the event a `staleTime` under the minimum is desired.
   * @default false
   */
  suppressStaleTimeWarning?: boolean;
  /**
   * A function to transform the raw fetched data (`TQueryFnData`) into another form (`TData`).
   * If not provided, the raw data returned by `fetcher` is used.
   */
  transform?: (data: TQueryFnData) => TData;
  /**
   * The maximum duration, in milliseconds, that fetched data is considered fresh.
   * After this time, data is considered expired and will be refetched when requested.
   * @default time.days(7)
   */
  cacheTime?: number;
  /**
   * If `true`, the store's caching mechanisms will be fully disabled, meaning that the store will
   * always refetch data on every call to `fetch()`, and the fetched data will not be stored unless
   * a `setData` function is provided.
   *
   * Disable caching if you always want fresh data on refetch.
   * @default false
   */
  disableCache?: boolean;
  /**
   * When `true`, the store actively fetches and refetches data as needed.
   * When `false`, the store will not automatically fetch data until explicitly enabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * Parameters to be passed to the fetcher, defined as either direct values or `ParamResolvable` functions.
   * Dynamic parameters using `AttachValue` will cause the store to refetch when their values change.
   */
  params?: {
    [K in keyof TParams]: ParamResolvable<TParams[K], TParams, S, TData>;
  };
  /**
   * The duration, in milliseconds, that data is considered fresh after fetching.
   * After becoming stale, the store may automatically refetch data in the background if there are active subscribers.
   *
   * **Note:** Stale times under 5 seconds are strongly discouraged.
   * @default time.minutes(2)
   */
  staleTime?: number;
};

/**
 * Represents a parameter that can be provided directly or defined via a reactive `AttachValue`.
 * A parameter can be:
 * - A static value (e.g. `string`, `number`).
 * - A function that returns an `AttachValue<T>` when given a `SignalFunction`.
 */
type ParamResolvable<T, TParams extends Record<string, unknown>, S extends StoreState<TData, TParams>, TData> =
  | T
  | (($: SignalFunction, store: QueryStore<TData, TParams, S>) => AttachValue<T>);

interface ResolvedParamsResult<TParams> {
  /**
   * Direct, non-reactive values resolved from the initial configuration.
   */
  directValues: Partial<TParams>;
  /**
   * Reactive parameter values wrapped in `AttachValue`, which trigger refetches when they change.
   */
  paramAttachVals: Partial<Record<keyof TParams, AttachValue<unknown>>>;
  /**
   * Fully resolved parameters, merging both direct and reactive values.
   */
  resolvedParams: TParams;
}

/**
 * The keys that make up the internal state of the store.
 */
type InternalStateKeys = keyof (StoreState<unknown, Record<string, unknown>> & PrivateStoreState);

const [persist, discard] = [true, false];

const SHOULD_PERSIST_INTERNAL_STATE_MAP: Record<string, boolean> = {
  /* Internal state to persist if the store is persisted */
  enabled: persist,
  error: persist,
  lastFetchedAt: persist,
  queryCache: persist,
  status: persist,

  /* Internal state and methods to discard */
  fetch: discard,
  getData: discard,
  getStatus: discard,
  isDataExpired: discard,
  isStale: discard,
  reset: discard,
  subscriptionCount: discard,
} satisfies Record<InternalStateKeys, boolean>;

export const time = {
  seconds: (n: number) => n * 1000,
  minutes: (n: number) => time.seconds(n * 60),
  hours: (n: number) => time.minutes(n * 60),
  days: (n: number) => time.hours(n * 24),
  weeks: (n: number) => time.days(n * 7),
};

const MIN_STALE_TIME = time.seconds(5);

/**
 * Creates a query-enabled Rainbow store with data fetching capabilities.
 * @template TQueryFnData - The raw data type returned by the fetcher
 * @template TParams - Parameters passed to the fetcher function
 * @template U - User-defined custom store state
 * @template TData - The transformed data type, if applicable (defaults to `TQueryFnData`)
 */
export function createQueryStore<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, unknown>,
  U = unknown,
  TData = TQueryFnData,
>(
  config: RainbowQueryStoreConfig<TQueryFnData, TParams, TData, StoreState<TData, TParams> & PrivateStoreState & U> & {
    params?: { [K in keyof TParams]: ParamResolvable<TParams[K], TParams, StoreState<TData, TParams> & PrivateStoreState & U, TData> };
  },
  customStateCreator?: StateCreator<U, [], [['zustand/subscribeWithSelector', never]]>,
  persistConfig?: RainbowPersistConfig<StoreState<TData, TParams> & PrivateStoreState & U>
): QueryStore<TData, TParams, StoreState<TData, TParams> & U> {
  type S = StoreState<TData, TParams> & PrivateStoreState & U;

  const {
    fetcher,
    onFetched,
    transform,
    cacheTime = time.days(7),
    disableCache = false,
    enabled = true,
    maxRetries = 3,
    onError,
    params,
    retryDelay = time.seconds(5),
    setData,
    staleTime = time.minutes(2),
    suppressStaleTimeWarning = false,
  } = config;

  if (IS_DEV && !suppressStaleTimeWarning && staleTime < MIN_STALE_TIME) {
    console.warn(
      `[RainbowQueryStore${persistConfig?.storageKey ? `: ${persistConfig.storageKey}` : ''}] ❌ Stale times under ${
        MIN_STALE_TIME / 1000
      } seconds are not recommended.`
    );
  }

  let directValues: Partial<TParams> = {};
  let paramAttachVals: Partial<Record<keyof TParams, AttachValue<unknown>>> = {};

  let activeFetchPromise: Promise<void> | null = null;
  let activeRefetchTimeout: NodeJS.Timeout | null = null;
  let lastFetchKey: string | null = null;

  const initialData = {
    enabled,
    error: null,
    lastFetchedAt: null,
    queryCache: {},
    status: QueryStatuses.Idle,
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

  const createState: StateCreator<S, [], [['zustand/subscribeWithSelector', never]]> = (set, get, api) => {
    const pruneCache = (state: S): S => {
      const newCache: Record<string, CacheEntry<TData>> = {};
      Object.entries(state.queryCache).forEach(([key, entry]) => {
        if (entry && Date.now() - entry.lastFetchedAt <= cacheTime) {
          newCache[key] = entry;
        }
      });
      return { ...state, queryCache: newCache };
    };

    const scheduleNextFetch = (params: TParams, options: FetchOptions | undefined) => {
      const effectiveStaleTime = options?.staleTime ?? staleTime;
      if (effectiveStaleTime <= 0 || effectiveStaleTime === Infinity) return;
      if (activeRefetchTimeout) {
        clearTimeout(activeRefetchTimeout);
        activeRefetchTimeout = null;
      }
      const currentQueryKey = getQueryKey(params);
      const lastFetchedAt =
        get().queryCache[currentQueryKey]?.lastFetchedAt || (disableCache && lastFetchKey === currentQueryKey ? get().lastFetchedAt : null);
      const timeUntilRefetch = lastFetchedAt ? effectiveStaleTime - (Date.now() - lastFetchedAt) : effectiveStaleTime;

      activeRefetchTimeout = setTimeout(() => {
        if (get().subscriptionCount > 0) {
          get().fetch(params, { force: true });
        }
      }, timeUntilRefetch);
    };

    const baseMethods = {
      async fetch(params: TParams | undefined, options: FetchOptions | undefined) {
        if (!get().enabled) return;
        const effectiveParams = params ?? getCurrentResolvedParams();
        const currentQueryKey = getQueryKey(effectiveParams);
        const isLoading = get().status === QueryStatuses.Loading;

        if (activeFetchPromise && lastFetchKey === currentQueryKey && isLoading && !options?.force) {
          return activeFetchPromise;
        }

        if (!options?.force && !disableCache) {
          const { errorInfo, lastFetchedAt } = get().queryCache[currentQueryKey] ?? {};
          const errorRetriesExhausted = errorInfo && errorInfo.retryCount >= maxRetries;
          if ((!errorInfo || errorRetriesExhausted) && lastFetchedAt && Date.now() - lastFetchedAt <= (options?.staleTime ?? staleTime)) {
            return;
          }
        }

        set(state => ({ ...state, error: null, status: QueryStatuses.Loading }));
        lastFetchKey = currentQueryKey;

        const fetchOperation = async () => {
          try {
            const rawResult = await fetcher(effectiveParams);
            let transformedData: TData;
            try {
              transformedData = transform ? transform(rawResult) : (rawResult as TData);
            } catch (transformError) {
              throw new RainbowError(`[createQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: transform failed`, {
                cause: transformError,
              });
            }

            set(state => {
              const lastFetchedAt = Date.now();
              let newState: S = {
                ...state,
                error: null,
                lastFetchedAt,
                status: QueryStatuses.Success,
              };

              if (!setData && !disableCache) {
                newState.queryCache = {
                  ...newState.queryCache,
                  [currentQueryKey]: {
                    data: transformedData,
                    errorInfo: null,
                    lastFetchedAt,
                  },
                };
              } else if (setData) {
                setData(transformedData, (partial: S | Partial<S> | ((state: S) => S | Partial<S>)) => {
                  newState = typeof partial === 'function' ? { ...newState, ...partial(newState) } : { ...newState, ...partial };
                });
                if (!disableCache) {
                  newState.queryCache = {
                    [currentQueryKey]: {
                      data: null,
                      errorInfo: null,
                      lastFetchedAt,
                    },
                  };
                }
              }

              return disableCache || cacheTime === Infinity ? newState : pruneCache(newState);
            });

            scheduleNextFetch(effectiveParams, options);

            if (onFetched) {
              try {
                onFetched(transformedData, set);
              } catch (onFetchedError) {
                logger.error(
                  new RainbowError(`[createQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: onFetched callback failed`, {
                    cause: onFetchedError,
                  })
                );
              }
            }
          } catch (error) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            const entry = get().queryCache[currentQueryKey];
            const currentRetryCount = entry?.errorInfo?.retryCount ?? 0;

            onError?.(typedError, currentRetryCount);

            if (currentRetryCount < maxRetries) {
              const errorRetryDelay = typeof retryDelay === 'function' ? retryDelay(currentRetryCount, typedError) : retryDelay;

              if (get().subscriptionCount > 0) {
                activeRefetchTimeout = setTimeout(() => {
                  if (get().subscriptionCount > 0) {
                    get().fetch(effectiveParams, { force: true });
                  }
                }, errorRetryDelay);
              }

              set(state => ({
                ...state,
                error: typedError,
                status: QueryStatuses.Error,
                queryCache: {
                  ...state.queryCache,
                  [currentQueryKey]: {
                    ...entry,
                    errorState: {
                      error: typedError,
                      retryCount: currentRetryCount + 1,
                    },
                  },
                },
              }));
            } else {
              set(state => ({
                ...state,
                status: QueryStatuses.Error,
                queryCache: {
                  ...state.queryCache,
                  [currentQueryKey]: {
                    ...entry,
                    errorState: {
                      error: typedError,
                      retryCount: currentRetryCount,
                    },
                  },
                },
              }));
            }

            logger.error(new RainbowError(`[createQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: Failed to fetch data`), {
              error: typedError,
            });
          } finally {
            activeFetchPromise = null;
            lastFetchKey = null;
          }
        };

        activeFetchPromise = fetchOperation();
        return activeFetchPromise;
      },

      getData(params?: TParams) {
        if (disableCache) return null;
        const currentQueryKey = getQueryKey(params ?? getCurrentResolvedParams());
        return get().queryCache[currentQueryKey]?.data ?? null;
      },

      getStatus() {
        const status = get().status;
        const currentQueryKey = getQueryKey(getCurrentResolvedParams());
        const lastFetchedAt =
          get().queryCache[currentQueryKey]?.lastFetchedAt ||
          (disableCache && lastFetchKey === currentQueryKey ? get().lastFetchedAt : null);

        return {
          isError: status === QueryStatuses.Error,
          isFetching: status === QueryStatuses.Loading,
          isIdle: status === QueryStatuses.Idle,
          isInitialLoading: !lastFetchedAt && status === QueryStatuses.Loading,
          isSuccess: status === QueryStatuses.Success,
        };
      },

      isDataExpired(cacheTimeOverride?: number) {
        const currentQueryKey = getQueryKey(getCurrentResolvedParams());
        const lastFetchedAt =
          get().queryCache[currentQueryKey]?.lastFetchedAt ||
          (disableCache && lastFetchKey === currentQueryKey ? get().lastFetchedAt : null);

        if (!lastFetchedAt) return true;
        const effectiveCacheTime = cacheTimeOverride ?? cacheTime;
        return Date.now() - lastFetchedAt > effectiveCacheTime;
      },

      isStale(staleTimeOverride?: number) {
        const currentQueryKey = getQueryKey(getCurrentResolvedParams());
        const lastFetchedAt =
          get().queryCache[currentQueryKey]?.lastFetchedAt ||
          (disableCache && lastFetchKey === currentQueryKey ? get().lastFetchedAt : null);

        if (!lastFetchedAt) return true;
        const effectiveStaleTime = staleTimeOverride ?? staleTime;
        return Date.now() - lastFetchedAt > effectiveStaleTime;
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

    const subscribeWithSelector = api.subscribe;

    api.subscribe = (listener: (state: S, prevState: S) => void) => {
      set(state => ({ ...state, subscriptionCount: state.subscriptionCount + 1 }));
      const unsubscribe = subscribeWithSelector(listener);

      const handleSetEnabled = subscribeWithSelector((state: S, prevState: S) => {
        if (state.enabled !== prevState.enabled) {
          if (state.enabled) {
            const currentParams = getCurrentResolvedParams();
            const currentKey = getQueryKey(currentParams);
            if (currentKey !== lastFetchKey) {
              state.fetch(currentParams, { force: true });
            } else if (!state.queryCache[currentKey] || state.isStale()) {
              state.fetch();
            } else {
              scheduleNextFetch(currentParams, undefined);
            }
          } else {
            if (activeRefetchTimeout) {
              clearTimeout(activeRefetchTimeout);
              activeRefetchTimeout = null;
            }
          }
        }
      });

      const { fetch, isStale } = get();
      const currentParams = getCurrentResolvedParams();

      if (!get().queryCache[getQueryKey(currentParams)] || isStale()) {
        fetch(currentParams, { force: true });
      } else {
        scheduleNextFetch(currentParams, undefined);
      }

      return () => {
        handleSetEnabled();
        unsubscribe();
        set(state => {
          const newCount = Math.max(state.subscriptionCount - 1, 0);
          if (newCount === 0) {
            if (activeRefetchTimeout) {
              clearTimeout(activeRefetchTimeout);
              activeRefetchTimeout = null;
            }
          }
          return { ...state, subscriptionCount: newCount };
        });
      };
    };

    const userState = customStateCreator?.(set, get, api) ?? ({} as U);

    /* Merge base data, user state, and methods into the final store state */
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
    ? createRainbowStore<StoreState<TData, TParams> & PrivateStoreState & U>(createState, combinedPersistConfig)
    : create<StoreState<TData, TParams> & PrivateStoreState & U>()(subscribeWithSelector(createState));

  const queryCapableStore: QueryStore<TData, TParams, S> = Object.assign(baseStore, {
    enabled,
    destroy: () => {
      for (const unsub of paramUnsubscribes) unsub();
      paramUnsubscribes = [];
      queryCapableStore.getState().reset();
    },
    fetch: (params?: TParams, options?: FetchOptions) => baseStore.getState().fetch(params, options),
    getData: () => baseStore.getState().getData(),
    getStatus: () => baseStore.getState().getStatus(),
    isDataExpired: (override?: number) => baseStore.getState().isDataExpired(override),
    isStale: (override?: number) => baseStore.getState().isStale(override),
    reset: () => baseStore.getState().reset(),
  });

  if (params) {
    const result = resolveParams<TParams, S, TData>(params, queryCapableStore);
    paramAttachVals = result.paramAttachVals;
    directValues = result.directValues;
  }

  const onParamChange = () => {
    const newParams = getCurrentResolvedParams();
    queryCapableStore.fetch(newParams, { force: true });
  };

  let paramUnsubscribes: Unsubscribe[] = [];

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

function resolveParams<TParams extends Record<string, unknown>, S extends StoreState<TData, TParams> & U, TData, U = unknown>(
  params: { [K in keyof TParams]: ParamResolvable<TParams[K], TParams, S, TData> },
  store: QueryStore<TData, TParams, S>
): ResolvedParamsResult<TParams> {
  const directValues: Partial<TParams> = {};
  const paramAttachVals: Partial<Record<keyof TParams, AttachValue<unknown>>> = {};
  const resolvedParams = {} as TParams;

  for (const key in params) {
    const param = params[key];
    if (typeof param === 'function') {
      const attachVal = param($, store);
      resolvedParams[key] = attachVal.value as TParams[typeof key];
      paramAttachVals[key] = attachVal;
    } else {
      resolvedParams[key] = param as TParams[typeof key];
      directValues[key] = param as TParams[typeof key];
    }
  }

  return { directValues, paramAttachVals, resolvedParams };
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
      ...(userPartialize ? userPartialize(clonedState) : omitStoreMethods(clonedState)),
      ...internalStateToPersist,
    } satisfies Partial<S>;
  };
}
