import { useAtomValue } from 'jotai';
import { QueryAtomState, QueryOptions, QueryStore } from './types';
import { useQueryAtom } from './useQueryAtom';

/**
 * 🧪 *Experimental*
 *
 * **A simple wrapper around `useQueryAtom()` that returns the query state directly, instead of an atom.**
 *
 * Designed to piggyback off of any `createQueryStore()` instance. The hook abstracts away the underlying query atom,
 * returning only the query state. It operates in parallel to the store — it does **not** update the store's state whatsoever,
 * and its cache is fully independent of the store's. It does not persist any data unless `useStoreCache` is set to `true`.
 *
 * It's meant primarily for cases where you want to use multiple sets of query parameters with a single store
 * instance, and is geared towards ephemeral queries where an in‑memory cache is sufficient.
 *
 * Because the underlying atom is abstracted, you can simply destructure the query state returned by this hook.
 *
 * ---
 * 📐 **API**
 * @param store - A stable reference to your `createQueryStore()` instance, e.g. `useUserAssetsStore`.
 * @param config - An object with the following properties:
 * - `enabled` (optional boolean): When false, the query won't auto-fetch on mount/params change. Defaults to true.
 * - `params` (TParams): Query parameters — omitted params are filled in with the store's current param values.
 * - `options` (optional object): **Static** configuration options (currently set once on initial mount).
 *
 * ---
 * ⚙️ **Options**
 *
 * *(All optional)*
 * - `cacheTime` (number): Cache expiry in ms (defaults to 5 minutes).
 * - `debugMode` (boolean): Enables debug logs.
 * - `disableAutoRefetching` (boolean): When true, the query won't automatically refetch when data becomes stale.
 * - `keepPreviousData` (boolean): Retains previous data during a fetch.
 * - `staleTime` (number): The duration, in milliseconds, that data is considered fresh after fetching.
 * - `useStoreCache` (boolean): When true, the query atom will cache its data in the store's cache.
 *
 * ---
 * @example
 * ```ts
 * const { data } = useQuery(useUserAssetsStore, {
 *   params: { address },
 *   options: {
 *     disableAutoRefetching: true,
 *     staleTime: time.seconds(30),
 *   }
 * });
 * ```
 */
export function useQuery<TQueryFnData, TParams extends Record<string, unknown> = Record<string, never>, U = unknown, TData = TQueryFnData>(
  store: QueryStore<TQueryFnData, TParams, U, TData>,
  config: {
    enabled?: boolean;
    options?: QueryOptions;
    params: Partial<TParams>;
  }
): QueryAtomState<TData> {
  return useAtomValue(useQueryAtom(store, config));
}
