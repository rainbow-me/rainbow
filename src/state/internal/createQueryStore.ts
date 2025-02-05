import equal from 'react-fast-compare';
import { StateCreator, StoreApi } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { UseBoundStoreWithEqualityFn, createWithEqualityFn } from 'zustand/traditional';
import { IS_DEV } from '@/env';
import { RainbowError, logger } from '@/logger';
import { time } from '@/utils';
import { RainbowPersistConfig, createRainbowStore, omitStoreMethods } from './createRainbowStore';
import { SubscriptionManager } from './queryStore/classes/SubscriptionManager';
import { $, AttachValue, SignalFunction, Unsubscribe, attachValueSubscriptionMap } from './signal';

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
 * - **`'success'`** : The most recent request has succeeded and data is available.
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
   * If `true`, the fetch will simply return the data without any internal handling or side effects,
   * running in parallel with any other ongoing fetches. Use together with `force: true` if you want to
   * guarantee that a fresh fetch is triggered regardless of the current store state.
   * @default false
   */
  skipStoreUpdates?: boolean;
  /**
   * Overrides the default stale time for this fetch, which is used to determine whether the requested data
   * should be refetched, or returned from the cache if available.
   */
  staleTime?: number;
  /**
   * Dictates whether the store's `queryKey` should be updated based on the params used in the fetch operation.
   * Useful if for instance you want to cache the manually fetched data, but skip updating the store's current
   * `queryKey` (which determines where `getData()` points to).
   *
   * ---
   * Defaults to `true` unless `skipStoreUpdates: true` is specified, in which case the default is `false`.
   */
  updateQueryKey?: boolean;
}

/**
 * Represents an entry in the query cache, which stores fetched data along with metadata, and error information
 * in the event the most recent fetch failed.
 */
type CacheEntry<TData> = {
  cacheTime: number;
  data: TData | null;
} & (
  | {
      errorInfo: {
        error: Error;
        lastFailedAt: number;
        retryCount: number;
      };
      lastFetchedAt: null;
    }
  | {
      errorInfo: {
        error: Error;
        lastFailedAt: number;
        retryCount: number;
      } | null;
      lastFetchedAt: number;
    }
);

/**
 * A specialized store interface that combines Zustand's store capabilities with remote data fetching support.
 *
 * In addition to Zustand's store API (such as `getState()` and `subscribe()`), this interface provides:
 * - **`enabled`**: A boolean indicating if the store is actively fetching data.
 * - **`queryKey`**: A string representation of the current query parameter values.
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
> extends UseBoundStoreWithEqualityFn<StoreApi<S>> {
  /**
   * Indicates whether the store should actively fetch data.
   * When `false`, the store won't automatically refetch data.
   */
  enabled: boolean;
  /**
   * The current query key, which is a string representation of the current query parameter values.
   */
  queryKey: string;
  /**
   * Initiates a data fetch for the given parameters. If no parameters are provided, the store's
   * current parameters are used.
   * @param params - Optional parameters to pass to the fetcher function.
   * @param options - Optional {@link FetchOptions} to customize the fetch behavior.
   * @returns A promise that resolves when the fetch operation completes.
   */
  fetch: (params?: TParams | Partial<TParams>, options?: FetchOptions) => Promise<TData | null>;
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
   * const isInitialLoading = useMyQueryStore(state => state.getStatus().isInitialLoading);
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
 * This is currently a placeholder type.
 */
type PrivateStoreState = Record<never, never>;

/**
 * The full state structure managed by the query store. This type is generally internal,
 * though the state it defines can be accessed via the store's public interface.
 */
type StoreState<TData, TParams extends Record<string, unknown>> = Pick<
  QueryStore<TData, TParams, StoreState<TData, TParams>>,
  'enabled' | 'queryKey' | 'fetch' | 'getData' | 'getStatus' | 'isDataExpired' | 'isStale' | 'reset'
> & {
  error: Error | null;
  lastFetchedAt: number | null;
  queryCache: Record<string, CacheEntry<TData> | undefined>;
  status: QueryStatus;
};

/**
 * Configuration options for creating a query-enabled Rainbow store.
 */
export type QueryStoreConfig<TQueryFnData, TParams extends Record<string, unknown>, TData, S extends StoreState<TData, TParams>> = {
  /**
   * **A function responsible for fetching data from a remote source.**
   * Receives parameters of type TParams and optionally an abort controller.
   * Returns either a promise or a raw data value of type TQueryFnData.
   *
   * ---
   * `abortController` is by default available, unless either:
   * - `abortInterruptedFetches` is set to `false` in the store's config
   * - The fetch was manually triggered with `skipStoreUpdates: true`
   */
  fetcher: (params: TParams, abortController: AbortController | null) => TQueryFnData | Promise<TQueryFnData>;
  /**
   * **A callback invoked whenever a fetch operation fails.**
   * Receives the error and the current retry count.
   */
  onError?: (error: Error, retryCount: number) => void;
  /**
   * **A callback invoked whenever fresh data is successfully fetched.**
   * Receives the transformed data and the store's set function, which can optionally be used to update store state.
   */
  onFetched?: (info: {
    data: TData;
    fetch: (params?: TParams | Partial<TParams>, options?: FetchOptions) => Promise<TData | null>;
    params: TParams;
    set: (partial: S | Partial<S> | ((state: S) => S | Partial<S>)) => void;
  }) => void;
  /**
   * **A function that overrides the default behavior of setting the fetched data in the store's query cache.**
   * Receives an object containing the transformed data, the query parameters, the query key, and the store's set function.
   *
   * When using `setData`, it’s important to note that you are taking full responsibility for managing query data. If your
   * query supports variable parameters (and thus multiple query keys) and you want to cache data for each key, you’ll need
   * to manually handle storing data based on the provided `params` or `queryKey`. Naturally, you will also bear
   * responsibility for pruning this data in the event you do not want it persisted indefinitely.
   *
   * Automatic refetching per your specified `staleTime` is still managed internally by the store. While no query *data*
   * will be cached internally if `setData` is provided, metadata such as the last fetch time for each query key is still
   * cached and tracked by the store, unless caching is fully disabled via `disableCache: true`.
   */
  setData?: (info: {
    data: TData;
    params: TParams;
    queryKey: string;
    set: (partial: S | Partial<S> | ((state: S) => S | Partial<S>)) => void;
  }) => void;
  /**
   * **A function to transform the raw fetched data** (`TQueryFnData`) into another form (`TData`).
   * If not provided, the raw data returned by `fetcher` is used.
   */
  transform?: (data: TQueryFnData, params: TParams) => TData;
  /**
   * If `true`, the store will abort any partially completed fetches when:
   * - A new fetch is initiated due to a change in parameters
   * - All components subscribed to the store via selectors are unmounted
   * @default true
   */
  abortInterruptedFetches?: boolean;
  /**
   * The maximum duration, in milliseconds, that fetched data is considered fresh.
   * After this time, data is considered expired and will be refetched when requested.
   * @default time.days(7)
   */
  cacheTime?: number | ((params: TParams) => number);
  /**
   * If `true`, the store will log debug messages to the console.
   * @default false
   */
  debugMode?: boolean;
  /**
   * If `true`, the store will **not** trigger automatic refetches when data becomes stale. This is
   * useful in cases where you want to refetch data on component mount if stale, but not automatically
   * if data becomes stale while your component is already mounted.
   * @default false
   */
  disableAutoRefetching?: boolean;
  /**
   * Controls whether the store's caching mechanisms are disabled. When disabled, the store will always refetch
   * data when params change, and fetched data will not be stored unless a `setData` function is provided.
   * @default false
   */
  disableCache?: boolean;
  /**
   * When `true`, the store actively fetches and refetches data as needed.
   * When `false`, the store will not automatically fetch data until explicitly enabled.
   * @default true
   */
  enabled?: boolean | ParamResolvable<boolean, TParams, S, TData>;
  /**
   * When `true`, the store's `getData` method will always return existing data from the cache if it exists,
   * regardless of whether the cached data is expired, until the data is pruned following a successful fetch.
   *
   * Additionally, when params change while the store is enabled, `getData` will return the previous data until
   * data for the new params is available.
   * @default false
   */
  keepPreviousData?: boolean;
  /**
   * The maximum number of times to retry a failed fetch operation.
   * @default 5
   */
  maxRetries?: number;
  /**
   * Parameters to be passed to the fetcher, defined as either direct values or `ParamResolvable` functions.
   * Dynamic parameters using `AttachValue` will cause the store to refetch when their values change.
   */
  params?: {
    [K in keyof TParams]: ParamResolvable<TParams[K], TParams, S, TData>;
  };
  /**
   * The delay between retries after a fetch error occurs, in milliseconds, defined as a number or a function that
   * receives the error and current retry count and returns a number.
   *
   * @default Exponential backoff starting at 5s, doubling each retry, capped at 5m:
   * ```ts
   * retryCount => Math.min(time.seconds(5) * Math.pow(2, retryCount), time.minutes(5))
   * ```
   */
  retryDelay?: number | ((retryCount: number, error: Error) => number);
  /**
   * The duration, in milliseconds, that data is considered fresh after fetching.
   * After becoming stale, the store may automatically refetch data in the background if there are active subscribers.
   *
   * **Note:** Stale times under 5 seconds are strongly discouraged.
   * @default time.minutes(2)
   */
  staleTime?: number;
  /**
   * Suppresses warnings in the event a `staleTime` under the minimum is desired.
   * @default false
   */
  suppressStaleTimeWarning?: boolean;
};

/**
 * Represents a parameter that can be provided directly or defined via a reactive `AttachValue`.
 * A parameter can be:
 * - A static value (e.g. `string`, `number`).
 * - A function that returns an `AttachValue<T>` when given a `SignalFunction`.
 */
type ParamResolvable<T, TParams extends Record<string, unknown>, S extends StoreState<TData, TParams>, TData> =
  | T
  | (($: SignalFunction, store: UseBoundStoreWithEqualityFn<StoreApi<S>>) => AttachValue<T>);

interface ResolvedEnabledResult {
  /**
   * The reactive enabled state, if provided as a function returning an AttachValue.
   */
  enabledAttachVal: AttachValue<boolean> | null;
  /**
   * The static enabled state, if provided as a direct boolean value.
   */
  enabledDirectValue: boolean | null;
  /**
   * The final enabled state, derived from either the reactive or static value.
   */
  resolvedEnabled: boolean;
}

interface ResolvedParamsResult<TParams> {
  /**
   * Reactive parameter values wrapped in `AttachValue`, which trigger refetches when they change.
   */
  attachVals: Partial<Record<keyof TParams, AttachValue<unknown>>>;
  /**
   * Direct, non-reactive values resolved from the initial configuration.
   */
  directValues: Partial<TParams>;
  /**
   * Fully resolved parameters, merging both direct and reactive values.
   */
  resolvedParams: TParams;
}

type CustomStateCreator<Q, U> = StateCreator<Q, [], [['zustand/subscribeWithSelector', never]], U>;

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
  queryKey: persist,
  status: persist,

  /* Internal state and methods to discard */
  fetch: discard,
  getData: discard,
  getStatus: discard,
  isDataExpired: discard,
  isStale: discard,
  reset: discard,
} satisfies Record<InternalStateKeys, boolean>;

const ABORT_ERROR = new Error('[createQueryStore: AbortError] Fetch interrupted');

const MIN_STALE_TIME = time.seconds(5);

export function createQueryStore<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, never>,
  U = unknown,
  TData = TQueryFnData,
>(
  config: QueryStoreConfig<TQueryFnData, TParams, TData, StoreState<TData, TParams> & PrivateStoreState & U> &
    ([TParams] extends [Record<string, never>]
      ? { params?: undefined }
      : {
          params: { [K in keyof TParams]: ParamResolvable<TParams[K], TParams, StoreState<TData, TParams> & PrivateStoreState & U, TData> };
        }),
  customStateCreator: CustomStateCreator<StoreState<TData, TParams> & U, U>,
  persistConfig?: RainbowPersistConfig<StoreState<TData, TParams> & PrivateStoreState & U>
): UseBoundStoreWithEqualityFn<StoreApi<StoreState<TData, TParams> & U>>;

export function createQueryStore<TQueryFnData, TParams extends Record<string, unknown> = Record<string, never>, TData = TQueryFnData>(
  config: QueryStoreConfig<TQueryFnData, TParams, TData, StoreState<TData, TParams> & PrivateStoreState> &
    ([TParams] extends [Record<string, never>]
      ? { params?: undefined }
      : {
          params: { [K in keyof TParams]: ParamResolvable<TParams[K], TParams, StoreState<TData, TParams> & PrivateStoreState, TData> };
        }),
  persistConfig?: RainbowPersistConfig<StoreState<TData, TParams> & PrivateStoreState>
): UseBoundStoreWithEqualityFn<StoreApi<StoreState<TData, TParams>>>;

/**
 * Creates a query-enabled Rainbow store with data fetching capabilities.
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
  config: QueryStoreConfig<TQueryFnData, TParams, TData, StoreState<TData, TParams> & PrivateStoreState & U> &
    ([TParams] extends [Record<string, never>]
      ? { params?: undefined }
      : {
          params: { [K in keyof TParams]: ParamResolvable<TParams[K], TParams, StoreState<TData, TParams> & PrivateStoreState & U, TData> };
        }),
  arg1?: CustomStateCreator<StoreState<TData, TParams> & U, U> | RainbowPersistConfig<StoreState<TData, TParams> & PrivateStoreState & U>,
  arg2?: RainbowPersistConfig<StoreState<TData, TParams> & PrivateStoreState & U>
): UseBoundStoreWithEqualityFn<StoreApi<StoreState<TData, TParams> & U>> {
  type S = StoreState<TData, TParams> & PrivateStoreState & U;

  /* If arg1 is a function, it's the customStateCreator; otherwise, it's the persistConfig. */
  const customStateCreator = typeof arg1 === 'function' ? arg1 : () => ({}) as U;
  const persistConfig = typeof arg1 === 'object' ? arg1 : arg2;

  const {
    abortInterruptedFetches = true,
    fetcher,
    onFetched,
    transform,
    cacheTime = time.days(7),
    debugMode = false,
    disableAutoRefetching = false,
    disableCache = false,
    enabled = true,
    keepPreviousData = false,
    maxRetries = 5,
    onError,
    params,
    retryDelay = defaultRetryDelay,
    setData,
    staleTime = time.minutes(2),
    suppressStaleTimeWarning = false,
  } = config;

  if (IS_DEV && !suppressStaleTimeWarning && staleTime < MIN_STALE_TIME) {
    console.warn(
      `[createQueryStore${persistConfig?.storageKey ? `: ${persistConfig.storageKey}` : ''}] ❌ Stale times under ${
        MIN_STALE_TIME / 1000
      } seconds are not recommended.`
    );
  }

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

  const initialData = {
    enabled: typeof enabled === 'function' ? false : enabled,
    error: null,
    lastFetchedAt: null,
    queryCache: {},
    queryKey: '',
    status: QueryStatuses.Idle,
  };

  const subscriptionManager = new SubscriptionManager({ disableAutoRefetching });

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
        abortController.signal.addEventListener('abort', () => reject(ABORT_ERROR), { once: true });

        Promise.resolve(fetcher(params, abortController)).then(resolve, reject);
      });
    } finally {
      if (activeAbortController === abortController) {
        activeAbortController = null;
      }
    }
  };

  const createState: StateCreator<S, [], [['zustand/subscribeWithSelector', never]]> = (set, get, api) => {
    subscriptionManager.init({
      onSubscribe: (enabled, isFirstSubscription, shouldThrottle) => {
        if (!directValues && !attachVals && params !== undefined) return (fetchAfterParamCreation = true);
        if (!enabled) return;

        if (isFirstSubscription) {
          const { isStale, queryKey: storeQueryKey } = get();
          const currentParams = getCurrentResolvedParams(attachVals, directValues);
          const currentQueryKey = getQueryKey(currentParams);

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

      const currentQueryKey = getQueryKey(params);
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
      ...customStateCreator(set, get, api),
      ...initialData,

      async fetch(params: TParams | Partial<TParams> | undefined, options: FetchOptions | undefined, isInternalFetch = false) {
        if (!options?.force && !subscriptionManager.get().enabled) return null;

        const { error, status } = get();

        const effectiveParams = !params
          ? getCurrentResolvedParams(attachVals, directValues)
          : hasAllRequiredParams(params, paramKeys)
            ? params
            : { ...getCurrentResolvedParams(attachVals, directValues), ...params };

        const currentQueryKey = getQueryKey(effectiveParams);
        const isLoading = status === QueryStatuses.Loading;
        const skipStoreUpdates = !!options?.skipStoreUpdates;
        const shouldUpdateQueryKey =
          typeof options?.updateQueryKey === 'boolean'
            ? options.updateQueryKey
            : isInternalFetch
              ? keepPreviousData
              : // Manual fetch call default
                !skipStoreUpdates;

        if (activeFetch?.promise && activeFetch.key === currentQueryKey && isLoading && !options?.force) {
          return activeFetch.promise;
        }

        if (abortInterruptedFetches && !skipStoreUpdates) abortActiveFetch();

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
          const isStale = !lastFetchedAt || Date.now() - lastFetchedAt >= (options?.staleTime ?? staleTime);

          if (!isStale && (!errorInfo || errorRetriesExhausted)) {
            if (!activeRefetchTimeout && subscriptionManager.get().subscriptionCount > 0 && staleTime !== 0 && staleTime !== Infinity) {
              scheduleNextFetch(effectiveParams, options);
            }
            if (enableLogs) console.log('[💾 Returning Cached Data 💾] for params:', JSON.stringify(effectiveParams));
            if (shouldUpdateQueryKey && storeQueryKey !== currentQueryKey) {
              set(state => ({ ...state, queryKey: currentQueryKey }));
            }
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
              throw new RainbowError(`[createQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: transform failed`, {
                cause: transformError,
              });
            }

            if (skipStoreUpdates) {
              if (enableLogs) console.log('[🥷 Successful Parallel Fetch 🥷] for params:', JSON.stringify(effectiveParams));
              return transformedData;
            }

            set(state => {
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
                    cacheTime: cacheTimeIsFunction ? cacheTime(effectiveParams) : cacheTime,
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
                      cacheTime: cacheTimeIsFunction ? cacheTime(effectiveParams) : cacheTime,
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
                onFetched({ data: transformedData, fetch: baseMethods.fetch, params: effectiveParams, set });
              } catch (onFetchedError) {
                logger.error(
                  new RainbowError(`[createQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: onFetched callback failed`, {
                    cause: onFetchedError,
                  })
                );
              }
            }

            return transformedData ?? null;
          } catch (error) {
            if (error === ABORT_ERROR || (error instanceof Error && error.name === 'AbortError')) {
              if (enableLogs) console.log('[❌ Fetch Aborted ❌] for params:', JSON.stringify(effectiveParams));
              return null;
            }

            if (skipStoreUpdates) {
              logger.error(new RainbowError(`[createQueryStore: ${persistConfig?.storageKey || currentQueryKey}]: Failed to fetch data`), {
                error,
              });
              return null;
            }

            const typedError = error instanceof Error ? error : new Error(String(error));
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
                    cacheTime: entry?.cacheTime ?? (cacheTimeIsFunction ? cacheTime(effectiveParams) : cacheTime),
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
                    cacheTime: entry?.cacheTime ?? (cacheTimeIsFunction ? cacheTime(effectiveParams) : cacheTime),
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
        set(state => ({ ...state, ...initialData, queryKey: getQueryKey(getCurrentResolvedParams(attachVals, directValues)) }));
      },
    };

    let lastHandledEnabled: boolean | null = null;
    const handleSetEnabled = (state: S, prevState: S) => {
      if (state.enabled !== prevState.enabled && lastHandledEnabled !== state.enabled) {
        lastHandledEnabled = state.enabled;
        subscriptionManager.setEnabled(state.enabled);
        if (state.enabled) {
          const currentParams = getCurrentResolvedParams(attachVals, directValues);
          const currentKey = state.queryKey;
          if (currentKey !== lastFetchKey || state.isStale()) {
            baseMethods.fetch(currentParams, undefined, true);
          } else {
            scheduleNextFetch(currentParams, undefined);
          }
        } else if (activeRefetchTimeout || abortInterruptedFetches) {
          if (abortInterruptedFetches) abortActiveFetch();
          if (activeRefetchTimeout) {
            clearTimeout(activeRefetchTimeout);
            activeRefetchTimeout = null;
          }
        }
      }
    };

    const subscribeWithSelector = api.subscribe;

    api.subscribe = (listener: (state: S, prevState: S) => void) => {
      const internalUnsubscribe = subscriptionManager.subscribe();
      const unsubscribe = subscribeWithSelector((state: S, prevState: S) => {
        listener(state, prevState);
        handleSetEnabled(state, prevState);
      });
      return () => {
        internalUnsubscribe();
        unsubscribe();
      };
    };

    return baseMethods;
  };

  const combinedPersistConfig = persistConfig
    ? {
        ...persistConfig,
        partialize: createBlendedPartialize(keepPreviousData, persistConfig.partialize),
      }
    : undefined;

  const queryStore = persistConfig?.storageKey
    ? createRainbowStore<S>(createState, combinedPersistConfig)
    : createWithEqualityFn<S>()(subscribeWithSelector(createState), Object.is);

  const { enabled: initialStoreEnabled, error, queryKey } = queryStore.getState();
  if (queryKey && !error) lastFetchKey = queryKey;

  if (params) {
    const {
      directValues: resolvedDirectValues,
      enabledAttachVal: resolvedEnabledAttachVal,
      enabledDirectValue: resolvedEnabledDirectValue,
      attachVals: resolvedAttachVals,
    } = resolveParams<TParams, S, TData>(enabled, params, queryStore);
    attachVals = { enabled: resolvedEnabledAttachVal, params: resolvedAttachVals };
    directValues = { enabled: resolvedEnabledDirectValue, params: resolvedDirectValues };
  }

  const onParamChange = () => {
    const newParams = getCurrentResolvedParams(attachVals, directValues);
    if (!keepPreviousData) {
      const newQueryKey = getQueryKey(newParams);
      queryStore.setState(state => ({ ...state, queryKey: newQueryKey }));
    }
    queryStore.getState().fetch(newParams, { updateQueryKey: keepPreviousData });
  };

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
  } else if (initialStoreEnabled) {
    subscriptionManager.setEnabled(initialStoreEnabled);
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
        if (!equal(oldVal, newVal)) {
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

function defaultRetryDelay(retryCount: number) {
  const baseDelay = time.seconds(5);
  const multiplier = Math.pow(2, retryCount);
  return Math.min(baseDelay * multiplier, time.minutes(5));
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
): param is ($: SignalFunction, store: UseBoundStoreWithEqualityFn<StoreApi<S>>) => AttachValue<T> {
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
  params: { [K in keyof TParams]: ParamResolvable<TParams[K], TParams, S, TData> },
  store: UseBoundStoreWithEqualityFn<StoreApi<S>>
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

function createBlendedPartialize<TData, TParams extends Record<string, unknown>, S extends StoreState<TData, TParams> & U, U = unknown>(
  keepPreviousData: boolean,
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
      ...pruneCache<S, TData, TParams>(keepPreviousData, null, internalStateToPersist),
    } satisfies Partial<S>;
  };
}
