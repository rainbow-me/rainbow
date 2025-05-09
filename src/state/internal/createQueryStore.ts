import { dequal } from 'dequal';
import { debounce } from 'lodash';
import { subscribeWithSelector } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';
import { IS_DEV, IS_TEST } from '@/env';
import { RainbowError, logger } from '@/logger';
import { time } from '@/utils';
import { createRainbowStore } from './createRainbowStore';
import { SubscriptionManager } from './queryStore/classes/SubscriptionManager';
import {
  BaseQueryStoreState,
  CacheEntry,
  FetchOptions,
  InternalStateKeys,
  ParamResolvable,
  QueryStatuses,
  QueryStoreConfig,
  QueryStoreParams,
  QueryStoreState,
  QueryStoreStateCreator,
  QueryStore,
  ResolvedEnabledResult,
  ResolvedParamsResult,
  StoreState,
} from './queryStore/types';
import { $, AttachValue, SignalFunction, Unsubscribe, attachValueSubscriptionMap } from './signal';
import {
  OptionallyPersistedRainbowStore,
  PersistedRainbowStore,
  RainbowPersistConfig,
  RainbowStateCreator,
  RainbowStore,
  SubscribeArgs,
} from './types';
import { omitStoreMethods } from './utils/persistUtils';

const [persist, discard] = [true, false];

const SHOULD_PERSIST_INTERNAL_STATE_MAP: Record<string, boolean> = {
  /* Internal state to persist if the store is persisted */
  error: persist,
  lastFetchedAt: persist,
  queryCache: persist,
  queryKey: persist,
  status: persist,

  /* Internal state and methods to discard */
  enabled: discard,
  fetch: discard,
  getData: discard,
  getStatus: discard,
  isDataExpired: discard,
  isStale: discard,
  reset: discard,
} satisfies Record<InternalStateKeys, boolean>;

const MIN_STALE_TIME = time.seconds(5);

/**
 * Creates a persisted, query-enabled Rainbow store with data fetching capabilities.
 *
 * @template TQueryFnData - The raw data type returned by the fetcher
 * @template TParams - Parameters passed to the fetcher function
 * @template U - User-defined custom store state
 * @template TData - The transformed data type, if applicable (defaults to `TQueryFnData`)
 * @template PersistedState - The persisted state type, if a stricter type than `Partial<U>` is desired
 */
export function createQueryStore<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, never>,
  U = unknown,
  TData = TQueryFnData,
  PersistedState extends Partial<U> = Partial<U>,
>(
  config: QueryStoreConfig<TQueryFnData, TParams, TData, QueryStoreState<TData, TParams, U>> &
    QueryStoreParams<TParams, QueryStoreState<TData, TParams, U>, TData>,
  RainbowStateCreator: QueryStoreStateCreator<QueryStoreState<TData, TParams, U>, U>,
  persistConfig: RainbowPersistConfig<QueryStoreState<TData, TParams, U>, PersistedState>
): PersistedRainbowStore<QueryStoreState<TData, TParams, U>, PersistedState>;

/**
 * Creates a conditionally persisted, query-enabled Rainbow store with data-fetching capabilities.
 *
 * `persistConfig` may be `undefined` – the returned store exposes `persist?`.
 *
 * @template TQueryFnData - The raw data type returned by the fetcher
 * @template TParams - Parameters passed to the fetcher function
 * @template U - User-defined custom store state
 * @template TData - The transformed data type, if applicable (defaults to `TQueryFnData`)
 * @template PersistedState - The persisted state type, if a stricter type than `Partial<U>` is desired
 */
export function createQueryStore<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, never>,
  U = unknown,
  TData = TQueryFnData,
  PersistedState extends Partial<U> = Partial<U>,
>(
  config: QueryStoreConfig<TQueryFnData, TParams, TData, QueryStoreState<TData, TParams, U>> &
    QueryStoreParams<TParams, QueryStoreState<TData, TParams, U>, TData>,
  RainbowStateCreator: QueryStoreStateCreator<QueryStoreState<TData, TParams, U>, U>,
  persistConfig: RainbowPersistConfig<QueryStoreState<TData, TParams, U>, PersistedState> | undefined
): OptionallyPersistedRainbowStore<QueryStoreState<TData, TParams, U>, PersistedState>;

/**
 * Creates a persisted, query-enabled Rainbow store with data fetching capabilities.
 *
 * @template TQueryFnData - The raw data type returned by the fetcher
 * @template TParams - Parameters passed to the fetcher function
 * @template TData - The transformed data type, if applicable (defaults to `TQueryFnData`)
 * @template PersistedState - The persisted state type, if a stricter type than `Partial<U>` is desired
 */
export function createQueryStore<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, never>,
  TData = TQueryFnData,
  PersistedState extends Partial<BaseQueryStoreState<TData, TParams>> = Partial<BaseQueryStoreState<TData, TParams>>,
>(
  config: QueryStoreConfig<TQueryFnData, TParams, TData, BaseQueryStoreState<TData, TParams>> &
    QueryStoreParams<TParams, BaseQueryStoreState<TData, TParams>, TData>,
  persistConfig: RainbowPersistConfig<BaseQueryStoreState<TData, TParams>, PersistedState>
): PersistedRainbowStore<BaseQueryStoreState<TData, TParams>, PersistedState>;

/**
 * Creates a conditionally persisted, query-enabled Rainbow store with data fetching capabilities.
 *
 * @template TQueryFnData - The raw data type returned by the fetcher
 * @template TParams - Parameters passed to the fetcher function
 * @template TData - The transformed data type, if applicable (defaults to `TQueryFnData`)
 * @template PersistedState - The persisted state type, if a stricter type than `Partial<U>` is desired
 */
export function createQueryStore<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, never>,
  TData = TQueryFnData,
  PersistedState extends Partial<BaseQueryStoreState<TData, TParams>> = Partial<BaseQueryStoreState<TData, TParams>>,
>(
  config: QueryStoreConfig<TQueryFnData, TParams, TData, BaseQueryStoreState<TData, TParams>> &
    QueryStoreParams<TParams, BaseQueryStoreState<TData, TParams>, TData>,
  persistConfig: RainbowPersistConfig<BaseQueryStoreState<TData, TParams>, PersistedState> | undefined
): OptionallyPersistedRainbowStore<BaseQueryStoreState<TData, TParams>, PersistedState>;

/**
 * Creates a query-enabled Rainbow store with data fetching capabilities.
 *
 * @template TQueryFnData - The raw data type returned by the fetcher
 * @template TParams - Parameters passed to the fetcher function
 * @template U - User-defined custom store state
 * @template TData - The transformed data type, if applicable (defaults to `TQueryFnData`)
 */
export function createQueryStore<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, never>,
  U = unknown,
  TData = TQueryFnData,
>(
  config: QueryStoreConfig<TQueryFnData, TParams, TData, QueryStoreState<TData, TParams, U>> &
    QueryStoreParams<TParams, QueryStoreState<TData, TParams, U>, TData>,
  RainbowStateCreator: QueryStoreStateCreator<QueryStoreState<TData, TParams, U>, U>
): RainbowStore<QueryStoreState<TData, TParams, U>>;

/**
 * Creates a query-enabled Rainbow store with data fetching capabilities.
 *
 * @template TQueryFnData - The raw data type returned by the fetcher
 * @template TParams - Parameters passed to the fetcher function
 * @template TData - The transformed data type, if applicable (defaults to `TQueryFnData`)
 */
export function createQueryStore<TQueryFnData, TParams extends Record<string, unknown> = Record<string, never>, TData = TQueryFnData>(
  config: QueryStoreConfig<TQueryFnData, TParams, TData, BaseQueryStoreState<TData, TParams>> &
    QueryStoreParams<TParams, BaseQueryStoreState<TData, TParams>, TData>
): RainbowStore<BaseQueryStoreState<TData, TParams>>;

/**
 * Creates a query-enabled Rainbow store with data fetching capabilities.
 *
 * @template TQueryFnData - The raw data type returned by the fetcher
 * @template TParams - Parameters passed to the fetcher function
 * @template U - User-defined custom store state
 * @template TData - The transformed data type, if applicable (defaults to `TQueryFnData`)
 * @template PersistedState - The persisted state type, if a stricter type than `Partial<U>` is desired
 */
export function createQueryStore<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, never>,
  U = unknown,
  TData = TQueryFnData,
  PersistedState extends Partial<QueryStoreState<TData, TParams, U>> = Partial<QueryStoreState<TData, TParams, U>>,
>(
  config: QueryStoreConfig<TQueryFnData, TParams, TData, QueryStoreState<TData, TParams, U>> &
    QueryStoreParams<TParams, QueryStoreState<TData, TParams, U>, TData>,
  arg1?:
    | QueryStoreStateCreator<QueryStoreState<TData, TParams, U>, U>
    | RainbowPersistConfig<QueryStoreState<TData, TParams, U>, PersistedState>,
  arg2?: RainbowPersistConfig<QueryStoreState<TData, TParams, U>, PersistedState>
): RainbowStore<QueryStoreState<TData, TParams, U>> | RainbowStore<QueryStoreState<TData, TParams, U>, PersistedState> {
  type S = QueryStoreState<TData, TParams, U>;

  /* If arg1 is a function, it's the custom state creator; otherwise, it's the persistConfig. */
  const customStateCreator = typeof arg1 === 'function' ? arg1 : () => ({}) as U;
  const persistConfig = typeof arg1 === 'object' && 'storageKey' in arg1 ? arg1 : arg2;

  const {
    fetcher,
    onError,
    onFetched,
    setData,
    transform,
    abortInterruptedFetches = true,
    cacheTime = time.days(7),
    debugMode = false,
    disableAutoRefetching = false,
    disableCache = false,
    enabled = true,
    keepPreviousData = false,
    maxRetries = 5,
    paramChangeThrottle,
    params,
    retryDelay = defaultRetryDelay,
    staleTime = time.minutes(2),
    suppressStaleTimeWarning = false,
    useParsableQueryKey = false,
  } = config;

  if (IS_DEV && !suppressStaleTimeWarning && staleTime < MIN_STALE_TIME) {
    console.warn(
      `[createQueryStore${persistConfig?.storageKey ? `: ${persistConfig.storageKey}` : ''}] ❌ Stale times under ${
        MIN_STALE_TIME / 1000
      } seconds are not recommended. Provided staleTime: ${staleTime / 1000} seconds`
    );
  }

  const getQueryKeyFn = useParsableQueryKey ? getParsableQueryKey : getQueryKey;

  const abortError = new Error('[createQueryStore: AbortError] Fetch interrupted');
  const cacheTimeIsFunction = typeof cacheTime === 'function';
  const enableLogs = IS_DEV && debugMode;
  const paramKeys: (keyof TParams)[] = Object.keys(config.params ?? {});

  let attachVals: { enabled: AttachValue<boolean> | null; params: Partial<Record<keyof TParams, AttachValue<unknown>>> } | null = null;
  let directValues: { enabled: boolean | null; params: Partial<TParams> } | null = null;
  let paramUnsubscribes: Unsubscribe[] = [];
  let fetchAfterParamCreation = false;

  let activeAbortController: AbortController | null = null;
  let activeFetch: { key: string; promise?: Promise<TData | null> } | null = null;
  let activeRefetchTimeout: NodeJS.Timeout | null = null;
  let lastFetchKey: string | null = null;
  let lastHandledEnabled: boolean | null = null;

  const initialData = {
    enabled: typeof enabled === 'function' ? false : enabled,
    error: null,
    lastFetchedAt: null,
    queryCache: {},
    queryKey: '',
    status: QueryStatuses.Idle,
  };

  const subscriptionManager = new SubscriptionManager({
    disableAutoRefetching,
    initialEnabled: initialData.enabled,
  });

  const abortActiveFetch = () => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
  };

  const fetchWithAbortControl = async (params: TParams): Promise<TQueryFnData> => {
    const abortController = new AbortController();
    activeAbortController = abortController;

    try {
      return await new Promise((resolve, reject) => {
        abortController.signal.addEventListener('abort', () => reject(abortError), { once: true });

        Promise.resolve(fetcher(params, abortController)).then(resolve, reject);
      });
    } finally {
      if (activeAbortController === abortController) {
        activeAbortController = null;
      }
    }
  };

  const createState: RainbowStateCreator<S> = (set, get, api) => {
    const originalSet = api.setState;
    const handleEnabledChange = (prevEnabled: boolean, newEnabled: boolean) => {
      if (prevEnabled !== newEnabled && lastHandledEnabled !== newEnabled) {
        lastHandledEnabled = newEnabled;
        subscriptionManager.setEnabled(newEnabled);
        if (newEnabled) {
          api.getState().fetch(undefined, { updateQueryKey: true });
        } else if (activeRefetchTimeout || abortInterruptedFetches) {
          if (abortInterruptedFetches) abortActiveFetch();
          if (activeRefetchTimeout) {
            clearTimeout(activeRefetchTimeout);
            activeRefetchTimeout = null;
          }
        }
      }
    };

    const setWithEnabledHandling: typeof originalSet = (partial, replace) => {
      const isPartialFunction = typeof partial === 'function';
      if (isPartialFunction || partial.enabled !== undefined) {
        let handleNewEnabled: (() => void) | undefined;
        originalSet(state => {
          const newPartial = isPartialFunction ? partial(state) : partial;
          const newEnabled = newPartial.enabled !== undefined ? newPartial.enabled : state.enabled;
          if (newEnabled !== state.enabled) handleNewEnabled = () => handleEnabledChange(state.enabled, newEnabled);
          return newPartial;
        }, replace);
        handleNewEnabled?.();
      } else {
        originalSet(partial, replace);
      }
    };

    // Override the store's set method
    api.setState = setWithEnabledHandling;

    subscriptionManager.init({
      onSubscribe: (enabled, isFirstSubscription, shouldThrottle) => {
        if (!directValues && !attachVals && (params || typeof config.enabled === 'function')) {
          fetchAfterParamCreation = true;
          return;
        }
        if (!enabled) return;

        if (isFirstSubscription) {
          const { isStale, queryKey: storeQueryKey } = get();
          const currentParams = getCurrentResolvedParams(attachVals, directValues);
          const currentQueryKey = getQueryKeyFn(currentParams);

          if (storeQueryKey !== currentQueryKey) set(state => ({ ...state, queryKey: currentQueryKey }));

          if (isStale()) {
            baseMethods.fetch(currentParams, undefined, true);
          } else {
            scheduleNextFetch(currentParams, undefined);
          }
        } else if (disableAutoRefetching && !shouldThrottle) {
          baseMethods.fetch(undefined, undefined, true);
        }
      },

      onLastUnsubscribe: () => {
        if (activeRefetchTimeout) {
          clearTimeout(activeRefetchTimeout);
          activeRefetchTimeout = null;
        }
        if (abortInterruptedFetches) abortActiveFetch();
      },
    });

    const scheduleNextFetch = (params: TParams, options: FetchOptions | undefined) => {
      if (disableAutoRefetching || options?.skipStoreUpdates) return;
      if (staleTime <= 0 || staleTime === Infinity) return;

      if (activeRefetchTimeout) {
        clearTimeout(activeRefetchTimeout);
        activeRefetchTimeout = null;
      }

      const currentQueryKey = getQueryKeyFn(params);
      const lastFetchedAt =
        (disableCache ? lastFetchKey === currentQueryKey && get().lastFetchedAt : get().queryCache[currentQueryKey]?.lastFetchedAt) || null;
      const timeUntilRefetch = lastFetchedAt ? staleTime - (Date.now() - lastFetchedAt) : staleTime;

      activeRefetchTimeout = setTimeout(() => {
        const { enabled, subscriptionCount } = subscriptionManager.get();
        if (enabled && subscriptionCount > 0) {
          baseMethods.fetch(params, { force: true }, true);
        }
      }, timeUntilRefetch);
    };

    const baseMethods = {
      ...customStateCreator(setWithEnabledHandling, get, api),
      ...initialData,

      async fetch(params: TParams | Partial<TParams> | undefined, options: FetchOptions | undefined, isInternalFetch = false) {
        if (!options?.force && !options?.skipStoreUpdates && !subscriptionManager.get().enabled) return null;

        const { error, status } = get();
        const effectiveParams = getCompleteParams(attachVals, directValues, paramKeys, params);
        const currentQueryKey = getQueryKeyFn(effectiveParams);
        const effectiveStaleTime = options?.staleTime ?? staleTime;
        const isLoading = status === QueryStatuses.Loading;
        const skipStoreUpdates = !!options?.skipStoreUpdates;
        const shouldUpdateQueryKey =
          typeof options?.updateQueryKey === 'boolean'
            ? options.updateQueryKey
            : isInternalFetch
              ? keepPreviousData
              : // Manual fetch call default
                !skipStoreUpdates;

        if (activeFetch?.promise && activeFetch.key === currentQueryKey && isLoading) {
          if (enableLogs) console.log('[🔄 Using Active Fetch 🔄] for params:', JSON.stringify(effectiveParams));
          return activeFetch.promise;
        }

        if (abortInterruptedFetches && !skipStoreUpdates && options?.updateQueryKey !== false) {
          abortActiveFetch();
        }

        if (!options?.force) {
          /* Check for valid cached data */
          const {
            lastFetchedAt: storeLastFetchedAt,
            queryCache: { [currentQueryKey]: cacheEntry },
            queryKey: storeQueryKey,
          } = get();

          const { errorInfo, lastFetchedAt: cachedLastFetchedAt } = cacheEntry ?? {};
          const errorRetriesExhausted = errorInfo && errorInfo.retryCount >= maxRetries;
          const lastFetchedAt = (disableCache ? lastFetchKey === currentQueryKey && storeLastFetchedAt : cachedLastFetchedAt) || null;
          const isStale = !lastFetchedAt || Date.now() - lastFetchedAt >= effectiveStaleTime;

          if (!isStale && (!errorInfo || errorRetriesExhausted || skipStoreUpdates)) {
            if (
              !skipStoreUpdates &&
              !activeRefetchTimeout &&
              subscriptionManager.get().subscriptionCount > 0 &&
              staleTime !== 0 &&
              staleTime !== Infinity
            ) {
              scheduleNextFetch(effectiveParams, options);
            }
            if (shouldUpdateQueryKey && storeQueryKey !== currentQueryKey) set(state => ({ ...state, queryKey: currentQueryKey }));
            if (enableLogs) console.log('[💾 Returning Cached Data 💾] for params:', JSON.stringify(effectiveParams));
            return cacheEntry?.data ?? null;
          }
        }

        if (!skipStoreUpdates) {
          if (activeRefetchTimeout) {
            clearTimeout(activeRefetchTimeout);
            activeRefetchTimeout = null;
          }
          if (error || !isLoading) set(state => ({ ...state, error: null, status: QueryStatuses.Loading }));
          activeFetch = { key: currentQueryKey };
        }

        const effectiveCacheTime = options?.cacheTime ?? (cacheTimeIsFunction ? cacheTime(effectiveParams) : cacheTime);

        const fetchOperation = async () => {
          try {
            if (enableLogs) {
              if (!isInternalFetch && params && !hasAllRequiredParams(params, paramKeys)) {
                console.log(
                  '[🔄 Fetching with Partial Params 🔄]\n',
                  '- Provided params:',
                  `${JSON.stringify(params)}\n`,
                  '- Filled in params:',
                  `${JSON.stringify(
                    Object.fromEntries(
                      Object.keys(effectiveParams)
                        .filter(key => !(key in params))
                        .map(key => [key, effectiveParams[key]])
                    )
                  )}`
                );
              } else {
                console.log('[🔄 Fetching 🔄] for params:', JSON.stringify(effectiveParams));
              }
            }

            const rawResult = await (abortInterruptedFetches && !skipStoreUpdates
              ? fetchWithAbortControl(effectiveParams)
              : fetcher(effectiveParams, null));

            const lastFetchedAt = Date.now();
            if (enableLogs) console.log('[✅ Fetch Successful ✅] for params:', JSON.stringify(effectiveParams));

            let transformedData: TData;
            try {
              transformedData = transform ? transform(rawResult, effectiveParams) : (rawResult as TData);
            } catch (transformError) {
              throw new RainbowError(
                `[createQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: transform failed`,
                transformError
              );
            }

            if (skipStoreUpdates) {
              if (enableLogs) console.log('[🥷 Successful Parallel Fetch 🥷] for params:', JSON.stringify(effectiveParams));
              if (options.skipStoreUpdates === 'withCache' && !disableCache) {
                set(state => ({
                  ...state,
                  queryCache: {
                    ...state.queryCache,
                    [currentQueryKey]: {
                      cacheTime: effectiveCacheTime,
                      data: transformedData,
                      errorInfo: null,
                      lastFetchedAt,
                    } satisfies CacheEntry<TData>,
                  },
                }));
              }
              return transformedData;
            }

            (setData ? setWithEnabledHandling : set)(state => {
              let newState: S = {
                ...state,
                error: null,
                lastFetchedAt,
                queryKey: shouldUpdateQueryKey ? currentQueryKey : state.queryKey,
                status: QueryStatuses.Success,
              };

              if (!setData && !disableCache) {
                if (enableLogs)
                  console.log(
                    '[💾 Setting Cache 💾] for params:',
                    JSON.stringify(effectiveParams),
                    '| Has previous data?:',
                    !!newState.queryCache[currentQueryKey]?.data
                  );
                newState.queryCache = {
                  ...newState.queryCache,
                  [currentQueryKey]: {
                    cacheTime: effectiveCacheTime,
                    data: transformedData,
                    errorInfo: null,
                    lastFetchedAt,
                  } satisfies CacheEntry<TData>,
                };
              } else if (setData) {
                if (enableLogs) console.log('[💾 Setting Data 💾] for params:', JSON.stringify(effectiveParams));
                setData({
                  data: transformedData,
                  params: effectiveParams,
                  queryKey: currentQueryKey,
                  set: (partial: S | Partial<S> | ((state: S) => S | Partial<S>)) => {
                    newState = typeof partial === 'function' ? { ...newState, ...partial(newState) } : { ...newState, ...partial };
                  },
                });
                if (!disableCache) {
                  newState.queryCache = {
                    ...newState.queryCache,
                    [currentQueryKey]: {
                      cacheTime: effectiveCacheTime,
                      data: null,
                      errorInfo: null,
                      lastFetchedAt,
                    } satisfies CacheEntry<TData>,
                  };
                }
              }

              return disableCache || cacheTime === Infinity
                ? newState
                : pruneCache<S, TData, TParams>(keepPreviousData, currentQueryKey, newState);
            });

            lastFetchKey = currentQueryKey;
            scheduleNextFetch(effectiveParams, options);

            if (onFetched) {
              try {
                onFetched({ data: transformedData, fetch: baseMethods.fetch, params: effectiveParams, set: setWithEnabledHandling });
              } catch (onFetchedError) {
                logger.error(
                  new RainbowError(
                    `[createQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: onFetched callback failed`,
                    onFetchedError
                  )
                );
              }
            }

            return transformedData ?? null;
          } catch (error) {
            if (error === abortError) {
              if (enableLogs) console.log('[❌ Fetch Aborted ❌] for params:', JSON.stringify(effectiveParams));
              return null;
            }

            const shouldThrow = !isInternalFetch && options?.throwOnError === true;
            const typedError = error instanceof Error ? error : new Error(String(error));

            if (skipStoreUpdates) {
              logger.error(new RainbowError(`[createQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: Failed to fetch data`), {
                error,
              });
              if (shouldThrow) throw typedError;
              return null;
            }

            const entry = disableCache ? undefined : get().queryCache[currentQueryKey];
            const currentRetryCount = entry?.errorInfo?.retryCount ?? 0;

            onError?.(typedError, currentRetryCount);

            if (currentRetryCount < maxRetries) {
              if (subscriptionManager.get().subscriptionCount > 0) {
                const errorRetryDelay = typeof retryDelay === 'function' ? retryDelay(currentRetryCount, typedError) : retryDelay;
                if (errorRetryDelay !== Infinity) {
                  activeRefetchTimeout = setTimeout(() => {
                    const { enabled, subscriptionCount } = subscriptionManager.get();
                    if (enabled && subscriptionCount > 0) {
                      baseMethods.fetch(params, { force: true }, true);
                    }
                  }, errorRetryDelay);
                }
              }

              set(state => ({
                ...state,
                error: typedError,
                queryCache: {
                  ...state.queryCache,
                  [currentQueryKey]: {
                    cacheTime: entry?.cacheTime ?? effectiveCacheTime,
                    data: entry?.data ?? null,
                    lastFetchedAt: entry?.lastFetchedAt ?? null,
                    errorInfo: {
                      error: typedError,
                      lastFailedAt: Date.now(),
                      retryCount: currentRetryCount + 1,
                    },
                  } satisfies CacheEntry<TData>,
                },
                queryKey: shouldUpdateQueryKey ? currentQueryKey : state.queryKey,
                status: QueryStatuses.Error,
              }));
            } else {
              /* Max retries exhausted */
              set(state => ({
                ...state,
                error: typedError,
                queryCache: {
                  ...state.queryCache,
                  [currentQueryKey]: {
                    cacheTime: entry?.cacheTime ?? effectiveCacheTime,
                    data: entry?.data ?? null,
                    lastFetchedAt: entry?.lastFetchedAt ?? null,
                    errorInfo: {
                      error: typedError,
                      lastFailedAt: Date.now(),
                      retryCount: maxRetries,
                    },
                  } satisfies CacheEntry<TData>,
                },
                queryKey: shouldUpdateQueryKey ? currentQueryKey : state.queryKey,
                status: QueryStatuses.Error,
              }));
            }

            logger.error(new RainbowError(`[createQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: Failed to fetch data`), {
              error,
            });

            if (shouldThrow) throw typedError;
            return null;
          } finally {
            if (!skipStoreUpdates) activeFetch = null;
          }
        };

        if (skipStoreUpdates) return fetchOperation();

        return (activeFetch = { key: currentQueryKey, promise: fetchOperation() }).promise;
      },

      getData(params?: TParams) {
        if (disableCache) return null;
        const currentQueryKey = params ? getQueryKey(params) : get().queryKey;

        const cacheEntry = get().queryCache[currentQueryKey];
        if (keepPreviousData) return cacheEntry?.data ?? null;
        const isExpired = !!cacheEntry?.lastFetchedAt && Date.now() - cacheEntry.lastFetchedAt >= cacheEntry.cacheTime;
        return isExpired ? null : cacheEntry?.data ?? null;
      },

      getStatus() {
        const { queryKey, status } = get();
        const lastFetchedAt =
          (disableCache ? lastFetchKey === queryKey && get().lastFetchedAt : get().queryCache[queryKey]?.lastFetchedAt) || null;

        return {
          isError: status === QueryStatuses.Error,
          isFetching: status === QueryStatuses.Loading,
          isIdle: status === QueryStatuses.Idle,
          isInitialLoading: !lastFetchedAt && status === QueryStatuses.Loading,
          isSuccess: status === QueryStatuses.Success,
        };
      },

      isDataExpired(cacheTimeOverride?: number) {
        const currentQueryKey = get().queryKey;
        const {
          lastFetchedAt: storeLastFetchedAt,
          queryCache: { [currentQueryKey]: cacheEntry },
        } = get();

        const lastFetchedAt = (disableCache ? lastFetchKey === currentQueryKey && storeLastFetchedAt : cacheEntry?.lastFetchedAt) || null;
        if (!lastFetchedAt) return true;

        const effectiveCacheTime = cacheTimeOverride ?? cacheEntry?.cacheTime;
        return effectiveCacheTime === undefined || Date.now() - lastFetchedAt >= effectiveCacheTime;
      },

      isStale(staleTimeOverride?: number) {
        const { queryKey } = get();
        const lastFetchedAt =
          (disableCache ? lastFetchKey === queryKey && get().lastFetchedAt : get().queryCache[queryKey]?.lastFetchedAt) || null;

        if (!lastFetchedAt) return true;
        const effectiveStaleTime = staleTimeOverride ?? staleTime;
        return Date.now() - lastFetchedAt >= effectiveStaleTime;
      },

      reset() {
        for (const unsub of paramUnsubscribes) unsub();
        paramUnsubscribes = [];
        if (activeRefetchTimeout) {
          clearTimeout(activeRefetchTimeout);
          activeRefetchTimeout = null;
        }
        if (abortInterruptedFetches) abortActiveFetch();
        activeFetch = null;
        lastFetchKey = null;
        set(state => ({ ...state, ...initialData, queryKey: getQueryKeyFn(getCurrentResolvedParams(attachVals, directValues)) }));
      },
    };

    // Override the store's subscribe method
    const originalSubscribe = api.subscribe;
    api.subscribe = ((...args: SubscribeArgs<S>) => {
      const internalUnsubscribe = subscriptionManager.subscribe();
      const unsubscribe = args.length === 1 ? originalSubscribe(args[0]) : originalSubscribe(...args);
      return () => {
        internalUnsubscribe();
        unsubscribe();
      };
    }) satisfies typeof originalSubscribe;

    return baseMethods;
  };

  const combinedPersistConfig = persistConfig?.storageKey
    ? {
        ...persistConfig,
        partialize: createBlendedPartialize<TData, TParams, S, U, PersistedState>(keepPreviousData, persistConfig.partialize),
      }
    : undefined;

  const queryStore = combinedPersistConfig
    ? createRainbowStore<S, PersistedState>(createState, combinedPersistConfig)
    : createWithEqualityFn<S>()(subscribeWithSelector(createState), Object.is);

  const { enabled: initialStoreEnabled, error, queryKey } = queryStore.getState();
  if (queryKey && !error) lastFetchKey = queryKey;

  if (params || typeof config.enabled === 'function') {
    const {
      directValues: resolvedDirectValues,
      enabledAttachVal: resolvedEnabledAttachVal,
      enabledDirectValue: resolvedEnabledDirectValue,
      attachVals: resolvedAttachVals,
    } = resolveParams<TParams, S, TData>(enabled, params, queryStore);
    attachVals = { enabled: resolvedEnabledAttachVal, params: resolvedAttachVals };
    directValues = { enabled: resolvedEnabledDirectValue, params: resolvedDirectValues };
  }

  function onParamChangeBase() {
    const newParams = getCurrentResolvedParams(attachVals, directValues);
    if (!keepPreviousData) {
      const newQueryKey = getQueryKeyFn(newParams);
      queryStore.setState(state => ({ ...state, queryKey: newQueryKey }));
    }
    queryStore.getState().fetch(newParams, { updateQueryKey: keepPreviousData });
  }

  const onParamChange =
    !IS_TEST && paramChangeThrottle
      ? debounce(
          onParamChangeBase,
          typeof paramChangeThrottle === 'number' ? paramChangeThrottle : paramChangeThrottle.delay,
          typeof paramChangeThrottle === 'number' ? { leading: false, maxWait: paramChangeThrottle, trailing: true } : paramChangeThrottle
        )
      : onParamChangeBase;

  if (attachVals?.enabled) {
    const attachVal = attachVals.enabled;
    const subscribeFn = attachValueSubscriptionMap.get(attachVal);

    if (subscribeFn) {
      let oldVal = attachVal.value;
      if (initialStoreEnabled !== oldVal) queryStore.setState(state => ({ ...state, enabled: oldVal }));
      if (oldVal) subscriptionManager.setEnabled(oldVal);

      if (enableLogs) console.log('[🌀 Enabled Subscription 🌀] Initial value:', oldVal);

      const unsub = subscribeFn(() => {
        const newVal = attachVal.value;
        if (newVal !== oldVal) {
          if (enableLogs) console.log('[🌀 Enabled Change 🌀] - [Old]:', `${oldVal},`, '[New]:', newVal);
          oldVal = newVal;
          queryStore.setState(state => ({ ...state, enabled: newVal }));
        }
      });
      paramUnsubscribes.push(unsub);
    }
  } else if (initialStoreEnabled !== initialData.enabled) {
    queryStore.setState(state => ({ ...state, enabled: initialData.enabled }));
  }

  for (const k in attachVals?.params) {
    const attachVal = attachVals.params[k];
    if (!attachVal) continue;

    const subscribeFn = attachValueSubscriptionMap.get(attachVal);
    if (enableLogs) console.log('[🌀 Param Subscription 🌀] Subscribed to param:', k);

    if (subscribeFn) {
      let oldVal = attachVal.value;
      const unsub = subscribeFn(() => {
        const newVal = attachVal.value;
        if (!dequal(oldVal, newVal)) {
          if (enableLogs) console.log('[🌀 Param Change 🌀] -', k, '- [Old]:', `${oldVal?.toString()},`, '[New]:', newVal?.toString());
          oldVal = newVal;
          onParamChange();
        }
      });
      paramUnsubscribes.push(unsub);
    }
  }

  if (fetchAfterParamCreation) onParamChange();

  return queryStore;
}

export function getQueryKey<TParams extends Record<string, unknown>>(params: TParams): string {
  return JSON.stringify(
    Object.keys(params)
      .sort()
      .map(key => params[key])
  );
}

export function getParsableQueryKey<TParams extends Record<string, unknown>>(params: TParams): string {
  return JSON.stringify(sortParamKeys(params));
}

export function parseQueryKey<TParams extends Record<string, unknown>>(queryKey: string): TParams {
  return JSON.parse(queryKey);
}

function sortParamKeys<TParams extends Record<string, unknown>>(params: TParams): TParams {
  if (typeof params !== 'object' || params === null) return params;
  return Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const value = params[key];
      acc[key] = value !== null && typeof value === 'object' ? sortParamKeys(value as Record<string, unknown>) : value;
      return acc;
    }, {}) as TParams;
}

export function defaultRetryDelay(retryCount: number) {
  const baseDelay = time.seconds(5);
  const multiplier = Math.pow(2, retryCount);
  return Math.min(baseDelay * multiplier, time.minutes(5));
}

function getCompleteParams<TParams extends Record<string, unknown>>(
  attachVals: { enabled: AttachValue<boolean> | null; params: Partial<Record<keyof TParams, AttachValue<unknown>>> } | null,
  directValues: { enabled: boolean | null; params: Partial<TParams> } | null,
  paramKeys: (keyof TParams)[],
  params?: Partial<TParams>
): TParams {
  const effectiveParams = !params
    ? getCurrentResolvedParams(attachVals, directValues)
    : hasAllRequiredParams(params, paramKeys)
      ? params
      : { ...getCurrentResolvedParams(attachVals, directValues), ...params };
  return effectiveParams;
}

function getCurrentResolvedParams<TParams extends Record<string, unknown>>(
  attachVals: { enabled: AttachValue<boolean> | null; params: Partial<Record<keyof TParams, AttachValue<unknown>>> } | null,
  directValues: { enabled: boolean | null; params: Partial<TParams> } | null
): TParams {
  const currentParams: Partial<TParams> = directValues?.params ?? {};
  for (const k in attachVals?.params) {
    const attachVal = attachVals.params[k];
    if (!attachVal) continue;
    currentParams[k as keyof TParams] = attachVal.value as TParams[keyof TParams];
  }
  return currentParams as TParams;
}

function hasAllRequiredParams<TParams extends Record<string, unknown>>(
  params: Partial<TParams> | TParams,
  requiredKeys: (keyof TParams)[]
): params is TParams {
  if (!params) return false;
  for (const key of requiredKeys) {
    if (!(key in params)) return false;
  }
  return true;
}

function pruneCache<S extends StoreState<TData, TParams>, TData, TParams extends Record<string, unknown>>(
  keepPreviousData: boolean,
  keyToPreserve: string | null,
  state: S | Partial<S>
): S | Partial<S> {
  if (!state.queryCache) return state;
  const pruneTime = Date.now();
  const preserve = keyToPreserve ?? ((keepPreviousData && state.queryKey) || null);

  let prunedSomething = false;
  const newCache: Record<string, CacheEntry<TData>> = Object.create(null);

  for (const key in state.queryCache) {
    const entry = state.queryCache[key];
    const isValid = !!entry && (pruneTime - (entry.lastFetchedAt ?? entry.errorInfo.lastFailedAt) < entry.cacheTime || key === preserve);
    if (!isValid) {
      prunedSomething = true;
    } else if (!keyToPreserve && entry.errorInfo && entry.errorInfo.retryCount > 0) {
      newCache[key] = { ...entry, errorInfo: { ...entry.errorInfo, retryCount: 0 } } satisfies CacheEntry<TData>;
      prunedSomething = true;
    } else {
      newCache[key] = entry;
    }
  }

  if (!prunedSomething) return state;

  return { ...state, queryCache: newCache };
}

function isResolvableParam<T, TParams extends Record<string, unknown>, S extends StoreState<TData, TParams>, TData>(
  param: ParamResolvable<T, TParams, S, TData>
): param is ($: SignalFunction, store: RainbowStore<S>) => AttachValue<T> {
  return typeof param === 'function';
}

type StaticParamValue<T, TParams extends Record<string, unknown>, S extends StoreState<TData, TParams>, TData> = Exclude<
  ParamResolvable<T, TParams, S, TData>,
  ($: SignalFunction, store: QueryStore<TData, TParams, S>) => AttachValue<T>
>;

function isStaticParam<T, TParams extends Record<string, unknown>, S extends StoreState<TData, TParams>, TData>(
  param: ParamResolvable<T, TParams, S, TData>
): param is StaticParamValue<T, TParams, S, TData> {
  return !isResolvableParam(param);
}

function resolveParams<TParams extends Record<string, unknown>, S extends StoreState<TData, TParams> & U, TData, U = unknown>(
  enabled: boolean | ParamResolvable<boolean, TParams, S, TData>,
  params: { [K in keyof TParams]: ParamResolvable<TParams[K], TParams, S, TData> } | undefined,
  store: RainbowStore<S>
): ResolvedParamsResult<TParams> & ResolvedEnabledResult {
  const attachVals: Partial<Record<keyof TParams, AttachValue<unknown>>> = {};
  const directValues: Partial<TParams> = {};
  const resolvedParams: TParams = {} as TParams;

  for (const key in params) {
    const param = params[key];
    if (isResolvableParam<TParams[typeof key], TParams, S, TData>(param)) {
      const attachVal = param($, store);
      attachVals[key] = attachVal;
      resolvedParams[key] = attachVal.value;
    } else if (isStaticParam<TParams[typeof key], TParams, S, TData>(param)) {
      directValues[key] = param;
      resolvedParams[key] = param;
    }
  }

  let enabledAttachVal: AttachValue<boolean> | null = null;
  let enabledDirectValue: boolean | null = null;
  let resolvedEnabled: boolean;

  if (isResolvableParam(enabled)) {
    const attachVal = enabled($, store);
    resolvedEnabled = attachVal.value;
    enabledAttachVal = attachVal;
  } else {
    resolvedEnabled = enabled;
    enabledDirectValue = enabled;
  }

  return { attachVals, directValues, enabledAttachVal, enabledDirectValue, resolvedEnabled, resolvedParams };
}

function createBlendedPartialize<
  TData,
  TParams extends Record<string, unknown>,
  S extends StoreState<TData, TParams> & U,
  U = unknown,
  PersistedState extends Partial<S> = Partial<S>,
>(
  keepPreviousData: boolean,
  userPartialize: RainbowPersistConfig<S, PersistedState>['partialize'] | undefined
): (state: S) => PersistedState {
  return (state: S): PersistedState => {
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
      ...pruneCache<S, TData, TParams>(keepPreviousData, null, internalStateToPersist),
    } satisfies PersistedState;
  };
}
