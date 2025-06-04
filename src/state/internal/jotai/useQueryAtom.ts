import { atom, ExtractAtomValue, useStore } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { useEffect, useRef } from 'react';
import { useDeepCompareMemo } from 'use-deep-compare';
import { StoreApi } from 'zustand';
import { IS_DEV } from '@/env';
import { useStableValue } from '@/hooks/useStableValue';
import { defaultRetryDelay, getParsableQueryKey as getQueryKey } from '@/state/internal/createQueryStore';
import { SubscriptionManager } from '@/state/internal/queryStore/classes/SubscriptionManager';
import { QueryStore } from '@/state/internal/queryStore/types';
import { time } from '@/utils';
import { CacheAtom, CacheAtomFamily, JotaiStore, QueryAtom, QueryOptions, RequiredQueryOptions } from './types';

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
 * const queryAtom = useQueryAtom(useUserAssetsStore, {
 *   params: { address },
 *   options: {
 *     disableAutoRefetching: true,
 *     staleTime: time.seconds(30),
 *   }
 * });
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
 * // Consume via useSelectAtom, which accepts an optional equality function:
 * const nftData = useSelectAtom(queryAtom, state => state.data, isEqual);
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
    params: Partial<TParams>;
    enabled?: boolean;
    options?: QueryOptions<TData>;
  }
): QueryAtom<TData, TParams> {
  const jotaiStore = useStore();
  const { queryAtom, setEnabled } = useStableValue(() =>
    getOrCreateQueryAtom<TQueryFnData, TParams, U, TData>(store, jotaiStore, {
      enabled: config.enabled ?? true,
      initialParams: config.params,
      initialQueryKey: getQueryKey(config.params),
      options: getConfigWithDefaults(config.options),
    })
  );

  const fetchInfo = useDeepCompareMemo(() => ({ params: config.params, queryKey: getQueryKey(config.params) }), [config.params]);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (config.enabled ?? true) jotaiStore.set(queryAtom, fetchInfo.params, fetchInfo.queryKey, config.enabled ?? true);
    else setEnabled(config.enabled ?? true);
  }, [config.enabled, fetchInfo, jotaiStore, queryAtom, setEnabled]);

  return queryAtom;
}

/**
 * Returns the provided config with default fallback values.
 */
function getConfigWithDefaults<TData>(options?: QueryOptions<TData>): RequiredQueryOptions<TData> {
  return {
    cacheTime: options?.cacheTime ?? time.minutes(5),
    debugMode: options?.debugMode ?? false,
    disableAutoRefetching: options?.disableAutoRefetching ?? false,
    keepPreviousData: options?.keepPreviousData ?? false,
    maxRetries: options?.maxRetries ?? 5,
    onError: options?.onError,
    onFetched: options?.onFetched,
    retryDelay: options?.retryDelay ?? defaultRetryDelay,
    staleTime: options?.staleTime ?? time.minutes(2),
    useStoreCache: options?.useStoreCache ?? false,
  };
}

/**
 * WeakMap cache keyed by store. Allows multiple hooks with identical params to dedupe requests
 * and share data. Each query atom acts as a simple pointer to the data in the shared cache that
 * corresponds to its associated store and param-derived query key.
 */
const queryCache = new WeakMap<StoreApi<unknown>, CacheAtomFamily<unknown>>();

const INITIAL_CACHE_ATOM_STATE: ExtractAtomValue<CacheAtom<null>> = {
  activeFetch: undefined,
  cleanupTimer: null,
  data: null,
  error: null,
  isFetching: false,
  lastFetchedAt: null,
  retryCount: null,
  subscriptionCount: 0,
};

function getInitialCacheAtomState<TData>(enabled: boolean): ExtractAtomValue<CacheAtom<TData>> {
  return { ...INITIAL_CACHE_ATOM_STATE, isFetching: enabled };
}

/**
 * Retrieves (or creates) the cache atom family for a given store.
 * @param store - The store instance.
 * @returns The cache atom family.
 */
function getCacheAtomFamily<TData>(
  store: StoreApi<unknown>,
  initialState: {
    enabled: boolean;
  }
): CacheAtomFamily<TData> {
  let family = queryCache.get(store) as CacheAtomFamily<TData> | undefined;
  if (family === undefined) {
    const initialAtomState = getInitialCacheAtomState<TData>(initialState.enabled);
    family = atomFamily<string, CacheAtom<TData>>(() => atom<ExtractAtomValue<CacheAtom<TData>>>(initialAtomState));
    queryCache.set(store, family as CacheAtomFamily<unknown>);
  }
  return family;
}

/**
 * Retrieves (or creates) the cache atom for a given store and query key.
 *
 * @param store - The store instance.
 * @param queryKey - The query key.
 * @param initialState - The initial state of the cache atom.
 * @returns A writable atom holding the CacheEntry for TData.
 */
function getCacheAtom<TData, TParams extends Record<string, unknown>>(
  store: QueryStore<TData, TParams>,
  queryKey: string,
  initialState: {
    enabled: boolean;
  }
): CacheAtom<TData> {
  const family = getCacheAtomFamily<TData>(store, initialState);
  return family(queryKey);
}

/**
 * Increments the subscription count for a cache entry.
 */
function incrementDataSubscriptionCount<TData>({
  cacheAtom,
  enableLogs,
  jotaiStore,
  queryKey,
}: {
  cacheAtom: CacheAtom<TData>;
  enableLogs: boolean;
  jotaiStore: JotaiStore;
  queryKey: string;
}): void {
  jotaiStore.set(cacheAtom, prev => {
    if (prev.cleanupTimer) {
      clearTimeout(prev.cleanupTimer);
    }

    if (enableLogs) {
      console.log('[📡 New Cache Subscription 📡] for query key:', queryKey, '| Subscribers:', prev.subscriptionCount + 1);
    }

    return stableAssign(prev, {
      cleanupTimer: null,
      subscriptionCount: prev.subscriptionCount + 1,
    });
  });
}

/**
 * Decrements the subscription count for a specific cache entry.
 * If the count reaches zero, a cleanup timer is scheduled to remove the cache entry after cacheTime ms.
 * If, after removal, the atom family becomes empty, the store is removed from the WeakMap.
 */
function decrementDataSubscriptionCount<TData>({
  cacheAtom,
  cacheAtomFamily,
  cacheTime,
  enableLogs,
  jotaiStore,
  queryKey,
  store,
}: {
  cacheAtom: CacheAtom<TData>;
  cacheAtomFamily: CacheAtomFamily<TData>;
  cacheTime: number;
  enableLogs: boolean;
  jotaiStore: JotaiStore;
  queryKey: string | undefined;
  store: StoreApi<unknown>;
}): void {
  jotaiStore.set(cacheAtom, prev => {
    const entry = stableAssign(prev, { subscriptionCount: prev.subscriptionCount - 1 });
    if (entry.subscriptionCount <= 0) {
      entry.cleanupTimer = setTimeout(() => {
        if (enableLogs) console.log('[🗑️ Pruning Cache Entry 🗑️] for query key:', queryKey);
        // Remove the cache entry from the atom family.
        if (queryKey) cacheAtomFamily.remove(queryKey);
        // If the atom family is now empty, remove the store from the global cache.
        if (![...cacheAtomFamily.getParams()].length) queryCache.delete(store);
      }, cacheTime);
      return stableAssign(entry, { cleanupTimer: entry.cleanupTimer });
    }
    return entry;
  });
}

/**
 * If the query key changes, decrement the old key's count and increment the new key's count.
 */
function updateSubscriptionForQueryKey<TData>({
  cacheAtomFamily,
  cacheTime,
  enableLogs,
  jotaiStore,
  newQueryKey,
  oldQueryKey,
  store,
}: {
  cacheAtomFamily: CacheAtomFamily<TData>;
  cacheTime: number;
  enableLogs: boolean;
  jotaiStore: JotaiStore;
  newQueryKey: string;
  oldQueryKey: string | undefined;
  store: StoreApi<unknown>;
}): void {
  if (oldQueryKey !== newQueryKey) {
    if (oldQueryKey) {
      decrementDataSubscriptionCount({
        cacheAtom: cacheAtomFamily(oldQueryKey),
        cacheAtomFamily,
        cacheTime,
        enableLogs,
        jotaiStore,
        queryKey: oldQueryKey,
        store,
      });
    }
    // Increment subscription count for the new query key.
    incrementDataSubscriptionCount({
      cacheAtom: cacheAtomFamily(newQueryKey),
      enableLogs,
      jotaiStore,
      queryKey: newQueryKey,
    });
  }
}

/**
 * Takes a previous object and a partial object of changes.
 * Returns `prev` if *no* fields actually changed by `Object.is`.
 * Otherwise returns a shallow clone with the updated fields.
 */
export function stableAssign<T extends object>(prev: T, partial: Partial<T>): T {
  let changed = false;
  for (const key of Object.keys(partial) as (keyof T)[]) {
    if (!Object.is(prev[key], partial[key])) {
      changed = true;
      break;
    }
  }
  // Nothing changed, return the old reference.
  if (!changed) return prev;
  // At least one field changed, so return a shallow copy.
  return { ...prev, ...partial };
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
    initialQueryKey: string;
    options: RequiredQueryOptions<TData>;
  }
): { queryAtom: QueryAtom<TData, TParams>; setEnabled: (enabled: boolean) => void } {
  const { enabled, initialParams, initialQueryKey, options } = config;
  const enableLogs = IS_DEV && options.debugMode;

  // Create a SubscriptionManager to track the number of components subscribed to this query atom.
  const subscriptionManager = new SubscriptionManager({
    disableAutoRefetching: options.disableAutoRefetching,
    initialEnabled: enabled,
  });
  const setEnabled = (enabled: boolean) => {
    subscriptionManager.setEnabled(enabled);
    if (!enabled && staleTimer) {
      clearTimeout(staleTimer);
      staleTimer = null;
    }
  };

  const cacheAtom = getCacheAtom<TData, TParams>(store, initialQueryKey, { enabled });
  const cacheAtomFamily = getCacheAtomFamily<TData>(store, { enabled });
  const queryKeyAtom = atom<string | undefined>(initialQueryKey);

  let latestFetchId = 0;
  let staleTimer: NodeJS.Timeout | null = null;

  function scheduleNextFetch(params: Partial<TParams> | undefined, queryKey: string): void {
    if (options.disableAutoRefetching || options.staleTime <= 0 || options.staleTime === Infinity) return;
    if (staleTimer) {
      clearTimeout(staleTimer);
      staleTimer = null;
    }
    // Retrieve the current cache entry for the given query key.
    const cachedEntry = jotaiStore.get(getCacheAtom<TData, TParams>(store, queryKey, { enabled }));
    const timeUntilRefetch = cachedEntry?.lastFetchedAt
      ? Math.max(options.staleTime - (Date.now() - cachedEntry.lastFetchedAt), 0)
      : options.staleTime;

    staleTimer = setTimeout(() => {
      const { enabled, subscriptionCount } = subscriptionManager.get();
      if (enabled && subscriptionCount > 0) {
        // Trigger a refresh via the query atom’s write function.
        jotaiStore.set(queryAtom, params, queryKey, enabled);
      }
    }, timeUntilRefetch);
  }

  const queryAtom: QueryAtom<TData, TParams> = atom(
    get => {
      const queryKey = get(queryKeyAtom) ?? initialQueryKey;
      return get(cacheAtomFamily(queryKey));
    },

    // Write function: updates the query key and fetches data if needed.
    async (get, set, params: Partial<TParams> | undefined, queryKey: string, enabled: boolean) => {
      // Ensure the subscription manager is enabled.
      if (enabled && !subscriptionManager.get().enabled) subscriptionManager.setEnabled(true);
      if (!options.keepPreviousData && queryKey !== get(queryKeyAtom)) set(queryKeyAtom, queryKey);

      // Get the cache atom for the requested query key.
      const cacheAtom = cacheAtomFamily(queryKey);
      const cached = get(cacheAtom);
      const isStale = !cached?.lastFetchedAt || Date.now() - cached.lastFetchedAt >= options.staleTime;

      // If the cache is fresh, then we just update baseAtom (if needed) and return.
      if (!isStale && cached && cached.data !== null) {
        if (enableLogs) console.log('[💾 Using Cached Data 💾] for params:', JSON.stringify(params));
        if (!staleTimer && subscriptionManager.get().subscriptionCount > 0) {
          scheduleNextFetch(params, queryKey);
        }
        // If baseAtom’s queryKey is different from the requested one, update it.
        if (queryKey !== get(queryKeyAtom)) set(queryKeyAtom, queryKey);
        return;
      }

      if (!options.keepPreviousData && queryKey !== get(queryKeyAtom)) {
        set(queryKeyAtom, queryKey);
      }

      // If the requested queryKey differs from currentQueryKey, update subscriptions and baseAtom.
      if (queryKey !== get(queryKeyAtom)) {
        updateSubscriptionForQueryKey({
          cacheAtomFamily,
          cacheTime: options.cacheTime,
          enableLogs,
          jotaiStore,
          newQueryKey: queryKey,
          oldQueryKey: get(queryKeyAtom),
          store,
        });
      }

      latestFetchId += 1;
      const currentFetchId = latestFetchId;
      if (currentFetchId !== latestFetchId) return;
      if (staleTimer) {
        clearTimeout(staleTimer);
        staleTimer = null;
      }

      // If there’s an active fetch, await it.
      const activeFetchPromise = get(cacheAtomFamily(queryKey)).activeFetch;
      if (activeFetchPromise) {
        if (enableLogs) console.log('[🔄 Using Active Fetch] for params:', JSON.stringify(params));
        await activeFetchPromise.then(() => {
          if (get(queryKeyAtom) !== queryKey) set(queryKeyAtom, queryKey);
        });
        return;
      }

      // Trigger a new fetch.
      const fetchPromise = (async () => {
        try {
          if (enableLogs) console.log('[🔄 Fetching 🔄] for params:', JSON.stringify(params));
          const data = await store.getState().fetch(params, {
            cacheTime: options.cacheTime,
            skipStoreUpdates: options.useStoreCache ? 'withCache' : true,
            staleTime: options.staleTime,
            throwOnError: true,
          });

          if (data !== null) options.onFetched?.(data);
          if (enableLogs) console.log('[✅ Fetch Successful ✅] for params:', JSON.stringify(params));
          // Update the cache entry for this query key.
          const newCacheAtom = cacheAtomFamily(queryKey);

          if (currentFetchId === latestFetchId) {
            set(newCacheAtom, prev => {
              if (enableLogs)
                console.log('[💾 Setting Cache 💾] for params:', JSON.stringify(params), '| Had previous data?:', !!prev?.data);
              return stableAssign(prev, {
                activeFetch: undefined,
                cleanupTimer: null,
                data,
                error: null,
                isFetching: false,
                lastFetchedAt: Date.now(),
                retryCount: null,
                subscriptionCount: prev.subscriptionCount,
              });
            });
            scheduleNextFetch(params, queryKey);
          }

          if (queryKey !== get(queryKeyAtom)) set(queryKeyAtom, queryKey);
        } catch (error) {
          if (currentFetchId !== latestFetchId) return;
          if (enableLogs) console.log('[❌ Fetch Failed ❌] for params:', JSON.stringify(params));

          const typedError = error instanceof Error ? error : new Error(String(error));
          const currentRetryCount = get(cacheAtom).retryCount ?? 0;

          options.onError?.(typedError, currentRetryCount);

          if (currentRetryCount < options.maxRetries) {
            if (subscriptionManager.get().subscriptionCount > 0) {
              const errorRetryDelay =
                typeof options.retryDelay === 'function' ? options.retryDelay(currentRetryCount, typedError) : options.retryDelay;
              if (errorRetryDelay !== Infinity) {
                if (enableLogs)
                  console.log(
                    `[🔄 Retrying Fetch (Attempt ${currentRetryCount + 1}/${options.maxRetries}) 🔄] for params:`,
                    JSON.stringify(params)
                  );
                staleTimer = setTimeout(() => {
                  const { enabled, subscriptionCount } = subscriptionManager.get();
                  if (enabled && subscriptionCount > 0) {
                    jotaiStore.set(queryAtom, params, queryKey, enabled);
                  }
                }, errorRetryDelay);
              }
            }

            set(cacheAtom, prev =>
              stableAssign(prev, {
                activeFetch: undefined,
                error: typedError,
                isFetching: false,
                retryCount: currentRetryCount + 1,
              })
            );
          } else {
            /* Max retries exhausted */
            set(cacheAtom, prev =>
              stableAssign(prev, {
                activeFetch: undefined,
                error: typedError,
                isFetching: false,
                retryCount: options.maxRetries,
              })
            );
          }
        } finally {
          if (currentFetchId === latestFetchId) {
            // Only update cache if activeFetch or isFetching need to be cleared
            const cacheEntry = get(cacheAtom);
            if (cacheEntry.activeFetch !== undefined || cacheEntry.isFetching) {
              set(cacheAtom, prev => stableAssign(prev, { activeFetch: undefined, isFetching: false }));
            }
            if (get(queryKeyAtom) !== queryKey) set(queryKeyAtom, queryKey);
          }
        }
      })();

      // Save the active fetch promise in the cache entry.
      set(cacheAtom, prev =>
        stableAssign(prev, {
          activeFetch: fetchPromise,
          isFetching: true,
        })
      );

      await fetchPromise;
    }
  );

  queryAtom.onMount = () => {
    if (enableLogs) console.log(`[🟢 onMount 🟢] Subscribing to query with params:`, JSON.stringify(initialParams));
    const unsubscribe = subscriptionManager.subscribe();
    const queryKey = jotaiStore.get(queryKeyAtom);
    incrementDataSubscriptionCount({ cacheAtom, enableLogs, jotaiStore, queryKey: queryKey ?? initialQueryKey });
    jotaiStore.set(queryAtom, initialParams, initialQueryKey, enabled);

    return () => {
      if (enableLogs) console.log(`[🗑️ onUnmount 🗑️] Unsubscribing from query`);
      if (staleTimer) {
        clearTimeout(staleTimer);
        staleTimer = null;
      }
      unsubscribe();
      const queryKey = jotaiStore.get(queryKeyAtom);
      decrementDataSubscriptionCount({
        cacheAtom: queryKey ? cacheAtomFamily(queryKey) : cacheAtom,
        cacheAtomFamily,
        cacheTime: options.cacheTime,
        enableLogs,
        jotaiStore,
        queryKey,
        store,
      });
      jotaiStore.set(queryKeyAtom, undefined);
    };
  };

  return { queryAtom, setEnabled };
}
