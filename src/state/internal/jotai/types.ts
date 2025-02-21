import { WritableAtom, atom, useStore } from 'jotai';
import { createQueryStore } from '../createQueryStore';

/**
 * Represents a writable atom that manages query state and refetches on param changes.
 */
export type QueryAtom<
  TData,
  TParams extends Record<string, unknown>,
  AtomStateType extends QueryAtomState<TData> | FullQueryAtomState<TData> = QueryAtomState<TData>,
> = WritableAtom<AtomStateType, [Partial<TParams> | undefined, string, boolean], Promise<void>>;

/**
 * Options for the `useQuery` and `useQueryAtom` hooks.
 */
export interface QueryOptions {
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
   * The duration, in milliseconds, that data is considered fresh after fetching.
   * After becoming stale, the store may automatically refetch data in the background if there are active subscribers.
   *
   * **Note:** Stale times under 5 seconds are strongly discouraged.
   * @default time.minutes(2)
   */
  staleTime?: number;
  /**
   * If `true`, fetched data will be saved in the store's cache. This allows for persistence if the store is configured
   * to persist data. Specify `cacheTime` to dictate when the fetched data should become eligible for pruning — otherwise
   * the default of 5 minutes will be used.
   * @default false
   */
  useStoreCache?: boolean;
}

/**
 * Helper type that represents the store returned by `createQueryStore()`.
 */
export type QueryStore<TQueryFnData, TParams extends Record<string, unknown>, U, TData> = ReturnType<
  typeof createQueryStore<TQueryFnData, TParams, U, TData>
>;

/**
 * Helper type that represents the Jotai store returned by `useStore()`.
 */
export type JotaiStore = ReturnType<typeof useStore>;

/**
 * Each cache entry holds the fetched data, its expiry time,
 * and a timer ID used for cleanup.
 */
export interface CacheEntry<TData = unknown> {
  activeFetch?: Promise<void>;
  cleanupTimer: NodeJS.Timeout | null;
  data: TData | null;
  lastFetchedAt: number;
  subscriptionCount: number;
}

/**
 * The public state for a query atom.
 */
export interface QueryAtomState<TData> {
  data: TData | null;
  error: Error | null;
  isFetching: boolean;
  queryKey: string;
}

/**
 * The full state for a query atom, inclusive of internal state.
 */
export interface FullQueryAtomState<TData> extends QueryAtomState<TData> {
  setEnabled: (enabled: boolean) => void;
}

/**
 * The type of the global data cache atom.
 */
export type CacheAtom<TData> = ReturnType<typeof atom<Map<string, CacheEntry<TData>>>>;
