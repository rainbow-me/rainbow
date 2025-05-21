import { StateCreator } from 'zustand';
import { AttachValue, SignalFunction } from '../signal';
import { BaseRainbowStore, RainbowStore } from '../types';

/**
 * Helper type that represents the store returned by `createQueryStore()`.
 */
export type QueryStore<
  TQueryFnData,
  TParams extends Record<string, unknown>,
  U = unknown,
  TData = TQueryFnData,
  PersistedState extends Partial<QueryStoreState<TData, TParams, U>> = Partial<QueryStoreState<TData, TParams, U>>,
> = RainbowStore<QueryStoreState<TData, TParams, U>> | RainbowStore<QueryStoreState<TData, TParams, U>, PersistedState>;

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
 * - **`'error'`**: The most recent request encountered an error.
 * - **`'idle'`**: No request in progress, no error, no data yet.
 * - **`'loading'`**: A request is currently in progress.
 * - **`'success'`**: The most recent request has succeeded and data is available.
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
 * Expanded options for debouncing query store parameter changes.
 */
export type DebounceOptions = {
  /* The number of milliseconds to delay. */
  delay: number;
  /* Specify invoking on the leading edge of the timeout. */
  leading?: boolean;
  /* The maximum time func is allowed to be delayed before it’s invoked. */
  maxWait?: number;
  /* Specify invoking on the trailing edge of the timeout. */
  trailing?: boolean;
};

/**
 * Defines additional options for a data fetch operation.
 */
export type FetchOptions = {
  /**
   * Overrides the store's default cacheTime for this fetch, which dictates when the data fetched in this operation
   * will become eligible for pruning.
   *
   * Has no effect if `skipStoreUpdates` is set to `true`.
   */
  cacheTime?: number;
  /**
   * Forces a fetch request even if there is fresh data available in the cache.
   *
   * Note: If a pending fetch matches the forced fetch's params, the pending promise *will* be returned.
   * @default false
   */
  force?: boolean;
  /**
   * If `true`, the fetch will simply return the data without any internal handling or side effects,
   * running in parallel with any other ongoing fetches. Use together with `force: true` if you want to
   * guarantee that a fresh fetch is triggered regardless of the current store state.
   *
   * ---
   * If set to `'withCache'`, the fetch will similarly run in parallel without affecting the store, but the
   * fetched data will be stored in the cache, as long as the store's config doesn't contain `disableCache: true`.
   * @default false
   */
  skipStoreUpdates?: boolean | 'withCache';
  /**
   * Overrides the store's default staleTime for this fetch, which dictates how fresh data must be to be returned
   * from the cache.
   */
  staleTime?: number;
  /**
   * If `true`, the fetch operation will throw an error if the fetch fails.
   * @default false
   */
  throwOnError?: boolean;
  /**
   * Dictates whether the store's `queryKey` should be updated based on the params used in the fetch operation.
   * Useful if for instance you want to cache the manually fetched data, but skip updating the store's current
   * `queryKey` (which determines where `getData()` points to).
   *
   * ---
   * Defaults to `true` unless `skipStoreUpdates: true` is specified, in which case the default is `false`.
   */
  updateQueryKey?: boolean;
};

/**
 * Represents an entry in the query cache, which stores fetched data along with metadata, and error information
 * in the event the most recent fetch failed.
 */
export type CacheEntry<TData> = {
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
interface QueryCapableStore<
  TData,
  TParams extends Record<string, unknown>,
  S extends Omit<StoreState<TData, TParams>, keyof PrivateStoreState>,
> extends BaseRainbowStore<S> {
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
   * Returns the cached data, if available, for the current or provided query parameters.
   * @param params - Optional parameters to retrieve cached data for.
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

export type QueryStoreStateCreator<Q, U> = StateCreator<Q, [], [['zustand/subscribeWithSelector', never]], U>;

/**
 * The private state managed by the query store, omitted from the store's public interface.
 * This is currently a placeholder type.
 */
export type PrivateStoreState = Record<never, never>;

/**
 * The full state structure managed by the query store. This type is generally internal,
 * though the state it defines can be accessed via the store's public interface.
 */
export type StoreState<TData, TParams extends Record<string, unknown>> = Pick<
  QueryCapableStore<TData, TParams, StoreState<TData, TParams>>,
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
   * Delay before triggering a fetch when parameters change.
   * Accepts a number (ms) or debounce options:
   *
   * `{ delay: number, leading?: boolean, trailing?: boolean, maxWait?: number }`
   * @default 0
   */
  paramChangeThrottle?: number | DebounceOptions;
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
  /**
   * If `true`, the store will use a parsable query key, allowing for more efficient custom cache handling.
   * This enables retrieving parsed params from the `queryKey` via `parseQueryKey`.
   * @default false
   */
  useParsableQueryKey?: boolean;
};

/**
 * Represents a parameter that can be provided directly or defined via a reactive `AttachValue`.
 * A parameter can be:
 * - A static value (e.g. `string`, `number`).
 * - A function that returns an `AttachValue<T>` when given a `SignalFunction`.
 */
export type ParamResolvable<T, TParams extends Record<string, unknown>, S extends StoreState<TData, TParams>, TData> =
  | T
  | (($: SignalFunction, store: BaseRainbowStore<S>) => AttachValue<T>);

export type ResolvedParamsResult<TParams> = {
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
};

export type ResolvedEnabledResult = {
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
};

/**
 * The keys that make up the internal state of the store.
 */
export type InternalStateKeys = keyof (StoreState<unknown, Record<string, unknown>> & PrivateStoreState);

/**
 * Internal helper type for extended state (when a custom state creator is provided).
 */
export type QueryStoreState<TData, TParams extends Record<string, unknown>, U> = StoreState<TData, TParams> & PrivateStoreState & U;

/**
 * Internal helper type for base state (when no custom state creator is provided).
 */
export type BaseQueryStoreState<TData, TParams extends Record<string, unknown>> = StoreState<TData, TParams> & PrivateStoreState;

/**
 * Internal helper type for the config’s params clause.
 */
export type QueryStoreParams<TParams extends Record<string, unknown>, S extends StoreState<TData, TParams>, TData = TParams> = [
  TParams,
] extends [Record<string, never>]
  ? { params?: undefined }
  : {
      params: {
        [K in keyof TParams]: ParamResolvable<TParams[K], TParams, S, TData>;
      };
    };
