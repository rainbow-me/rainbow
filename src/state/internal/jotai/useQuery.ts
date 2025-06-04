import { DependencyList } from 'react';
import { QueryStore } from '@/state/internal/queryStore/types';
import { QueryAtomState, QueryOptions } from './types';
import { useQueryAtom } from './useQueryAtom';
import { useSelectAtom } from './useStableAtom';
import { isDependencyList } from './utils';

/**
 * 🧪 *Experimental*
 *
 * **A simple wrapper around `useQueryAtom` that returns the query state directly, instead of an atom.**
 *
 * Designed to piggyback off of any `createQueryStore()` instance. The hook abstracts away the underlying query atom,
 * returning only the query state. It operates in parallel to the store — it does **not** update the store's state whatsoever,
 * and its cache is fully independent of the store's. It does not persist any data unless `useStoreCache` is set to `true`.
 *
 * It's meant primarily for cases where you want to use multiple sets of query parameters with a single store
 * instance, and is geared towards ephemeral queries where an in‑memory cache is sufficient.
 *
 * ---
 * 📐 **API**
 * @param store - A stable reference to a `createQueryStore()` instance, e.g. `useUserAssetsStore`.
 * @param selector - A function that selects data from the query state.
 * @param config - An object with the following properties:
 * - `params` (TParams): Query parameters — omitted params are filled in with the store's current param values.
 * - `enabled` (optional boolean): When false, the query won't auto-fetch on mount/params change. Defaults to true.
 * - `options` (optional object): **Static** configuration options (currently set once on initial mount).
 * @param equalityFn (or dependency list) - Either:
 *   - An equality function `(prev: Selected, next: Selected) => boolean`, or
 *   - A dependency list for **memoizing the selector** (if no custom equality function is provided).
 * @param selectorDeps (optional) - A dependency list for memoizing the **selector**.
 *   - Note that dependencies are **not** needed for params or enabled state changes.
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
 * const externalAsset = useQuery(
 *   useExternalTokenStore,
 *   state => state.data,
 *   { params, options: QUERY_OPTIONS }
 * );
 * ```
 */
export function useQuery<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, never>,
  U = unknown,
  TData = TQueryFnData,
  Selected = TData,
>(
  store: QueryStore<TQueryFnData, TParams, U, TData>,
  selector: (state: QueryAtomState<TData>, prevSlice?: Selected) => Selected,
  config: {
    params: Partial<TParams>;
    enabled?: boolean;
    options?: QueryOptions<TData>;
  },
  deps: DependencyList
): Selected;

export function useQuery<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, never>,
  U = unknown,
  TData = TQueryFnData,
  Selected = TData,
>(
  store: QueryStore<TQueryFnData, TParams, U, TData>,
  selector: (state: QueryAtomState<TData>, prevSlice?: Selected) => Selected,
  config: {
    params: Partial<TParams>;
    enabled?: boolean;
    options?: QueryOptions<TData>;
  },
  equalityFn?: (a: Selected, b: Selected) => boolean,
  deps?: DependencyList
): Selected;

export function useQuery<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, never>,
  U = unknown,
  TData = TQueryFnData,
  Selected = TData,
>(
  store: QueryStore<TQueryFnData, TParams, U, TData>,
  selector: (state: QueryAtomState<TData>, prevSlice?: Selected) => Selected,
  config: {
    params: Partial<TParams>;
    enabled?: boolean;
    options?: QueryOptions<TData>;
  },
  eqFnOrDeps: ((a: Selected, b: Selected) => boolean) | DependencyList = Object.is,
  providedDeps: DependencyList = []
): Selected {
  const arg4IsDeps = isDependencyList(eqFnOrDeps);
  const equalityFn = arg4IsDeps ? Object.is : eqFnOrDeps;
  const deps = arg4IsDeps ? eqFnOrDeps : providedDeps;
  const queryAtom = useQueryAtom<TQueryFnData, TParams, U, TData>(store, config);

  return useSelectAtom(queryAtom, selector, equalityFn, deps);
}
