import { atom, useAtomValue, useSetAtom, useStore } from 'jotai';
import { useEffect, useState } from 'react';
import { useDeepCompareMemo } from 'use-deep-compare';
import { StoreApi } from 'zustand';
import { IS_DEV } from '@/env';
import { getQueryKey } from '@/state/internal/createQueryStore';
import { SubscriptionManager } from '@/state/internal/queryStore/classes/SubscriptionManager';
import { time } from '@/utils';
import { CacheAtom, CacheEntry, FullQueryAtomState, JotaiStore, QueryAtom, QueryAtomState, QueryOptions, QueryStore } from './types';

/**
 * 🧪 *Experimental*
 *
 * **A hook that returns a stable Jotai query atom bound to a specific query store.**
 *
 * Designed to piggyback off of any `createQueryStore()` instance. The returned atom operates in parallel to the
 * store — it does **not** update the store's state whatsoever, and its cache is fully independent of the store's.
 * It does not persist any data unless `useStoreCache` is set to `true`.
 *
 * It's meant primarily for cases where you want to use multiple sets of query parameters with a single store
 * instance, and is geared towards ephemeral queries where an in‑memory cache is sufficient.
 *
 * Because a stable atom is returned, you have direct and granular control over when and where the reactive state
 * the atom contains is accessed. You can pass the query atom between components or store it in a shared context,
 * incurring re-renders only where the query atom's state is accessed, e.g. via `useAtomValue(queryAtom)`.
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
 * const { data } = useAtomValue(
 *   useQueryAtom(useUserAssetsStore, {
 *     params: { address },
 *     options: {
 *       disableAutoRefetching: true,
 *       staleTime: time.seconds(30),
 *     }
 *   })
 * );
 * ```
 *
 * ---
 * @example
 * **Using derived atoms to more narrowly select specific data:**
 *
 * ```ts
 * // The stable query atom (e.g. created in a context provider):
 * const queryAtom = useQueryAtom(useUserAssetsStore, config);
 *
 * // Create a simple derived atom:
 * const [nftData] = useStableAtomValue(
 *   atom(get => get(queryAtom).data?.[uniqueId])
 * );
 *
 * // Or if needed, use selectAtom with an equality function:
 * const [nftData] = useStableAtomValue(
 *   selectAtom(queryAtom, get => get.data?.[uniqueId], isEqual)
 * );
 * ```
 */
export function useQueryAtom<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, never>,
  U = unknown,
  TData = TQueryFnData,
>(
  store: QueryStore<TQueryFnData, TParams, U, TData>,
  config: {
    enabled?: boolean;
    options?: QueryOptions;
    params: Partial<TParams>;
  }
): QueryAtom<TData, TParams> {
  const jotaiStore = useStore();
  const [queryAtom] = useState<QueryAtom<TData, TParams, FullQueryAtomState<TData>>>(() =>
    getOrCreateQueryAtom<TQueryFnData, TParams, U, TData>(store, jotaiStore, {
      enabled: config.enabled ?? true,
      initialParams: config.params,
      options: getConfigWithDefaults(config.options),
    })
  );

  const { setEnabled } = useAtomValue(queryAtom);
  const triggerFetch = useSetAtom(queryAtom);

  const queryKey = useDeepCompareMemo(() => getQueryKey(config.params), [config.params]);

  useEffect(() => {
    if (config.enabled ?? true) triggerFetch(config.params, queryKey, config.enabled ?? true);
    else setEnabled(config.enabled ?? true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.enabled, queryKey, setEnabled, triggerFetch]);

  return queryAtom;
}

/**
 * Returns the provided config with default fallback values.
 */
function getConfigWithDefaults(options?: QueryOptions): Required<QueryOptions> {
  return {
    cacheTime: options?.cacheTime ?? time.minutes(5),
    debugMode: options?.debugMode ?? false,
    disableAutoRefetching: options?.disableAutoRefetching ?? false,
    keepPreviousData: options?.keepPreviousData ?? false,
    staleTime: options?.staleTime ?? time.minutes(2),
    useStoreCache: options?.useStoreCache ?? false,
  };
}

/**
 * WeakMap cache keyed by store. Allows multiple hooks with identical params to dedupe requests
 * and share data. Each query atom acts as a simple pointer to the data in the shared cache that
 * corresponds to its associated store and param-derived query key.
 */
const queryCache = new WeakMap<StoreApi<unknown>, CacheAtom<unknown>>();

/**
 * Retrieves or creates the shared data cache atom for a given store.
 */
function getCacheAtom<TQueryFnData, TParams extends Record<string, unknown>, U, TData>(
  store: QueryStore<TQueryFnData, TParams, U, TData>
): CacheAtom<TData> {
  let cacheAtom = queryCache.get(store) as CacheAtom<TData> | undefined;
  if (!cacheAtom) {
    cacheAtom = atom<Map<string, CacheEntry<TData>>>(new Map());
    queryCache.set(store, cacheAtom as CacheAtom<unknown>);
  }
  return cacheAtom;
}

/**
 * Increments the subscription count for a given query key by updating the global data cache.
 */
function incrementDataSubscriptionCount<TData>({
  cacheAtom,
  jotaiStore,
  queryKey,
}: {
  cacheAtom: CacheAtom<TData>;
  jotaiStore: JotaiStore;
  queryKey: string;
}): void {
  jotaiStore.set(cacheAtom, prev => {
    const newMap = new Map(prev);
    const entry = newMap.get(queryKey);
    if (entry) {
      if (entry.cleanupTimer) {
        clearTimeout(entry.cleanupTimer);
        entry.cleanupTimer = null;
      }
      entry.subscriptionCount += 1;
      newMap.set(queryKey, entry);
    } else {
      newMap.set(queryKey, { data: null, lastFetchedAt: 0, subscriptionCount: 1, cleanupTimer: null });
    }
    return newMap;
  });
}

/**
 * Decrements the subscription count for a specific CacheEntry.
 * If the count reaches zero, a cleanup timer is scheduled to remove the cache entry after cacheTime ms.
 * If there's nothing remaining in the store's WeakMap entry, the store is deleted from the WeakMap.
 */
function decrementDataSubscriptionCount<TData>({
  cacheAtom,
  cacheTime,
  enableLogs,
  jotaiStore,
  queryKey,
  store,
}: {
  cacheAtom: CacheAtom<TData>;
  cacheTime: number;
  enableLogs: boolean;
  jotaiStore: JotaiStore;
  queryKey: string;
  store: StoreApi<unknown>;
}): void {
  jotaiStore.set(cacheAtom, prev => {
    const newMap = new Map(prev);
    const entry = newMap.get(queryKey);
    if (entry) {
      entry.subscriptionCount -= 1;
      if (entry.subscriptionCount <= 0) {
        entry.cleanupTimer = setTimeout(() => {
          jotaiStore.set(cacheAtom, prev => {
            const updated = new Map(prev);
            if (enableLogs) console.log('[🗑️ Pruning Cache Entry 🗑️] for query key:', queryKey);
            updated.delete(queryKey);
            if (updated.size === 0) queryCache.delete(store);
            return updated;
          });
        }, cacheTime);
      }
      newMap.set(queryKey, entry);
    }
    return newMap;
  });
}

/**
 * If the query key changes, decrement the old key's count and increment the new key's count.
 */
function updateSubscriptionForQueryKey<TData>({
  cacheAtom,
  cacheTime,
  enableLogs,
  jotaiStore,
  newQueryKey,
  oldQueryKey,
  store,
}: {
  cacheAtom: CacheAtom<TData>;
  cacheTime: number;
  enableLogs: boolean;
  jotaiStore: JotaiStore;
  newQueryKey: string;
  oldQueryKey: string;
  store: StoreApi<unknown>;
}): void {
  if (oldQueryKey !== newQueryKey) {
    decrementDataSubscriptionCount({ cacheAtom, cacheTime, enableLogs, jotaiStore, queryKey: oldQueryKey, store });
    incrementDataSubscriptionCount({ cacheAtom, jotaiStore, queryKey: newQueryKey });
  }
}

/**
 * Returns (or creates) a query atom for the given store and initial parameters.
 *
 * The atom’s write function triggers fetches if needed and internally updates the queryKey based
 * on the provided params. It also updates the subscription count attached to the corresponding
 * cached data entry.
 */
function getOrCreateQueryAtom<
  TQueryFnData,
  TParams extends Record<string, unknown> = Record<string, never>,
  U = unknown,
  TData = TQueryFnData,
>(
  store: QueryStore<TQueryFnData, TParams, U, TData>,
  jotaiStore: JotaiStore,
  config: {
    enabled: boolean;
    initialParams: Partial<TParams> | undefined;
    options: Required<QueryOptions>;
  }
): QueryAtom<TData, TParams, FullQueryAtomState<TData>> {
  const { enabled, initialParams, options } = config;

  const cacheAtom = getCacheAtom(store);
  const enableLogs = IS_DEV && options.debugMode;
  const initialQueryKey = getQueryKey(initialParams ?? {});

  // Create a SubscriptionManager to track the number of components subscribed to the query atom.
  const subscriptionManager = new SubscriptionManager({ disableAutoRefetching: options.disableAutoRefetching });
  subscriptionManager.setEnabled(enabled);

  let currentQueryKey = initialQueryKey;
  let latestFetchId = 0;
  let staleTimer: NodeJS.Timeout | null = null;

  const baseAtom = atom<FullQueryAtomState<TData>>({
    data: null,
    error: null,
    isFetching: enabled,
    queryKey: initialQueryKey,
    setEnabled: (enabled: boolean) => {
      subscriptionManager.setEnabled(enabled);
      if (!enabled && staleTimer) {
        clearTimeout(staleTimer);
        staleTimer = null;
      }
    },
  });

  incrementDataSubscriptionCount({ cacheAtom, jotaiStore, queryKey: currentQueryKey });

  function scheduleNextFetch(params: Partial<TParams> | undefined, queryKey: string) {
    if (options.disableAutoRefetching || options.staleTime <= 0 || options.staleTime === Infinity) return;
    if (staleTimer) {
      clearTimeout(staleTimer);
      staleTimer = null;
    }
    const cache = jotaiStore.get(cacheAtom);
    const cachedEntry = cache.get(queryKey);
    const timeUntilRefetch = cachedEntry ? Math.max(options.staleTime - (Date.now() - cachedEntry.lastFetchedAt), 0) : options.staleTime;
    staleTimer = setTimeout(() => {
      const { enabled, subscriptionCount } = subscriptionManager.get();
      if (enabled && subscriptionCount > 0) {
        jotaiStore.set(queryAtom, params, queryKey, enabled);
      }
    }, timeUntilRefetch);
  }

  const queryAtom: QueryAtom<TData, TParams, FullQueryAtomState<TData>> = atom(
    get => {
      const state = get(baseAtom);
      // Use the query key to select the cached data to show.
      const cache = get(cacheAtom);
      const cached = cache.get(state.queryKey);
      return { ...state, data: cached?.data ?? null } satisfies QueryAtomState<TData>;
    },

    async (get, set, params: Partial<TParams> | undefined, queryKey: string, enabled: boolean) => {
      if (enabled && !subscriptionManager.get().enabled) subscriptionManager.setEnabled(true);

      const cache = get(cacheAtom);
      const cached = cache.get(queryKey);
      const isStale = !cached || Date.now() - cached.lastFetchedAt >= options.staleTime;

      if (!isStale && cached && cached.data !== null) {
        if (enableLogs) console.log('[💾 Using Cached Data 💾] for params:', JSON.stringify(params));
        // Even if the fetch is not strictly needed, we may schedule a background refresh.
        if (!staleTimer && subscriptionManager.get().subscriptionCount > 0) {
          scheduleNextFetch(params, queryKey);
        }
        // Ensure the atom reflects the current state.
        set(baseAtom, prev => ({ ...prev, error: null, isFetching: false, queryKey }));
        return;
      }

      if (queryKey !== currentQueryKey) {
        // A change in parameters (a new query key)
        updateSubscriptionForQueryKey({
          cacheAtom,
          cacheTime: options.cacheTime,
          enableLogs,
          jotaiStore,
          newQueryKey: queryKey,
          oldQueryKey: currentQueryKey,
          store,
        });
        currentQueryKey = queryKey;
        // If keepPreviousData is false, clear displayed data by updating the query key immediately.
        // If true, leave the query key unchanged so that the UI continues to show the old data.
        set(
          baseAtom,
          prev =>
            ({
              ...prev,
              error: null,
              isFetching: true,
              queryKey: options.keepPreviousData ? prev.queryKey : queryKey,
            }) satisfies QueryAtomState<TData>
        );
      } else {
        // Stale refresh (same query key): update ephemeral state, but keep the query key unchanged.
        set(
          baseAtom,
          prev =>
            ({
              ...prev,
              error: null,
              isFetching: true,
            }) satisfies QueryAtomState<TData>
        );
      }

      latestFetchId += 1;
      const currentFetchId = latestFetchId;
      if (staleTimer) {
        clearTimeout(staleTimer);
        staleTimer = null;
      }

      const activeFetchPromise = cached?.activeFetch;
      if (activeFetchPromise) {
        if (enableLogs) console.log('[🔄 Using Active Fetch] for params:', JSON.stringify(params));
        try {
          await activeFetchPromise;
          set(
            baseAtom,
            prev =>
              ({
                ...prev,
                error: null,
                isFetching: false,
                queryKey,
              }) satisfies QueryAtomState<TData>
          );
        } catch (error) {
          set(
            baseAtom,
            prev =>
              ({
                ...prev,
                error: error instanceof Error ? error : new Error(String(error)),
                isFetching: false,
                queryKey,
              }) satisfies QueryAtomState<TData>
          );
        }
        return;
      }

      // Trigger the fetch.
      const fetchPromise = (async () => {
        try {
          if (enableLogs) console.log('[🔄 Fetching 🔄] for params:', JSON.stringify(params));
          const data = await store.getState().fetch(params, {
            cacheTime: options.cacheTime,
            skipStoreUpdates: options.useStoreCache ? 'withCache' : true,
            staleTime: options.staleTime,
          });
          if (currentFetchId !== latestFetchId) return;
          if (enableLogs) console.log('[✅ Fetch Successful ✅] for params:', JSON.stringify(params));
          // Update the global cache with new data.
          set(cacheAtom, prev => {
            const newCache = new Map(prev);
            const oldEntry = newCache.get(queryKey);
            newCache.set(queryKey, {
              cleanupTimer: null,
              data,
              lastFetchedAt: Date.now(),
              subscriptionCount: oldEntry ? oldEntry.subscriptionCount : 0,
            });
            if (enableLogs)
              console.log('[💾 Setting Cache 💾] for params:', JSON.stringify(params), '| Had previous data?:', !!oldEntry?.data);
            return newCache;
          });
          // On success, update ephemeral state:
          set(
            baseAtom,
            prev =>
              ({
                ...prev,
                error: null,
                isFetching: false,
                queryKey,
              }) satisfies QueryAtomState<TData>
          );
          scheduleNextFetch(params, queryKey);
        } catch (error) {
          if (currentFetchId !== latestFetchId) return;
          if (enableLogs) console.log('[❌ Fetch Failed ❌] for params:', JSON.stringify(params));
          set(
            baseAtom,
            prev =>
              ({
                ...prev,
                error: error instanceof Error ? error : new Error(String(error)),
                isFetching: false,
                queryKey,
              }) satisfies QueryAtomState<TData>
          );
        } finally {
          // Clear activeFetch no matter the outcome.
          set(cacheAtom, prev => {
            const newCache = new Map(prev);
            const entry = newCache.get(queryKey);
            if (entry) {
              entry.activeFetch = undefined;
              newCache.set(queryKey, entry);
            }
            return newCache;
          });
        }
      })();

      // Update the cache atom with the activeFetch promise.
      set(cacheAtom, prev => {
        const newCache = new Map(prev);
        const entry = newCache.get(queryKey);
        if (entry) {
          entry.activeFetch = fetchPromise;
          newCache.set(queryKey, entry);
        }
        return newCache;
      });

      await fetchPromise;
    }
  );

  queryAtom.onMount = () => {
    if (enableLogs) console.log(`[🟢 onMount 🟢] Subscribing to query with params:`, JSON.stringify(initialParams));
    const unsubscribe = subscriptionManager.subscribe();
    return () => {
      if (enableLogs) console.log(`[🗑️ onUnmount 🗑️] Unsubscribing from query`);
      if (staleTimer) {
        clearTimeout(staleTimer);
        staleTimer = null;
      }
      unsubscribe();
      decrementDataSubscriptionCount({
        cacheAtom,
        cacheTime: options.cacheTime,
        enableLogs,
        jotaiStore,
        queryKey: currentQueryKey,
        store,
      });
    };
  };

  return queryAtom;
}
