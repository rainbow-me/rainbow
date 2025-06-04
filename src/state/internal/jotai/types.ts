import { PrimitiveAtom, WritableAtom, useStore } from 'jotai';
import { AtomFamily } from 'jotai/vanilla/utils/atomFamily';

/**
 * Represents a writable atom that manages query state and refetches on param changes.
 */
export type QueryAtom<TData, TParams extends Record<string, unknown>> = WritableAtom<
  QueryAtomState<TData>,
  [Partial<TParams> | undefined, string, boolean],
  Promise<void>
>;

/**
 * Options for the `useQuery` and `useQueryAtom` hooks.
 */
export interface QueryOptions<TData = unknown> {
  /**
   * How long (in ms) to cache fetched data in memory after last being used by a mounted component.
   * @default time.minutes(5)
   */
  cacheTime?: number;
  /**
   * If `true`, the query atom will log debug messages to the console.
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
   * When `true`, retains previous data while fetching new data.
   * @default false
   */
  keepPreviousData?: boolean;
  /**
   * The maximum number of times to retry a failed fetch operation.
   * @default 5
   */
  maxRetries?: number;
  /**
   * **A callback invoked whenever a fetch operation fails.**
   * Receives the error and the current retry count.
   */
  onError?: (error: Error, retryCount: number) => void;
  /**
   * **A callback invoked whenever fresh data is successfully fetched.**
   */
  onFetched?: (data: TData) => void;
  /**
   * The duration, in milliseconds, that data is considered fresh after fetching.
   * After becoming stale, the store may automatically refetch data in the background if there are active subscribers.
   *
   * **Note:** Stale times under 5 seconds are strongly discouraged.
   * @default time.minutes(2)
   */
  staleTime?: number;
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
   * If `true`, fetched data will be saved in the store's cache. This allows for persistence if the store is configured
   * to persist data. Specify `cacheTime` to dictate when the fetched data should become eligible for pruning — otherwise
   * the default of 5 minutes will be used.
   * @default false
   */
  useStoreCache?: boolean;
}

export type RequiredQueryOptions<TData> = Required<Omit<QueryOptions<TData>, 'onError' | 'onFetched'>> & {
  onError: QueryOptions<TData>['onError'];
  onFetched: QueryOptions<TData>['onFetched'];
};

/**
 * Helper type that represents the Jotai store returned by `useStore()`.
 */
export type JotaiStore = ReturnType<typeof useStore>;

export type CacheEntryAtomFamily<TData> = (queryKey: string) => WritableAtom<string, [CacheEntry<TData>], void>;

/**
 * Each cache entry holds the fetched data, its expiry time,
 * and a timer ID used for cleanup.
 */
export interface CacheEntry<TData = unknown> {
  activeFetch?: Promise<void>;
  cleanupTimer: NodeJS.Timeout | null;
  data: TData | null;
  lastFetchedAt: number | null;
  subscriptionCount: number;
}

/**
 * The public state for a query atom.
 */
export interface QueryAtomState<TData> {
  data: TData | null;
  error: Error | null;
  retryCount: number | null;
  isFetching: boolean;
}

/**
 * The type of the global data cache atom.
 */
export type CacheAtom<TData> = PrimitiveAtom<Omit<QueryAtomState<TData> & CacheEntry<TData>, 'queryKey'>>;

/**
 * The type of the global data cache atom family.
 */
export type CacheAtomFamily<TData> = AtomFamily<string, CacheAtom<TData>>;
