import {
  createQueryStore,
  getQueryKey,
  type CacheEntry,
  type QueryStore,
  type QueryStoreState,
  type ReactiveParam,
  type SetDataParams,
} from '@storesjs/stores';

import { getConsistentArray } from '@/helpers/getConsistentArray';
import { type Route } from '@/navigation/routesNames';
import { type SubscribeArgs, type SubscribeOverloads } from '@/state/internal/types';
import { useNavigationStore, type SwipeRoute } from '@/state/navigation/navigationStore';
import { time } from '@/utils/time';

import { type LineChartPreviewData, type LineChartPreviewSource } from './types';

// ============ Types ========================================================== //

/**
 * Fetched charts by id. `null` clears a chart; omitted ids keep their current data.
 */
export type LineChartPreviewFetchResult = Partial<Record<string, LineChartPreviewData | null>>;

/**
 * Loads chart previews for ids that need fresh data.
 */
export type LineChartPreviewFetcher = (
  chartIds: readonly string[],
  abortController: AbortController | null
) => Promise<LineChartPreviewFetchResult>;

/**
 * Restricts store fetching to an active navigation scope.
 */
export type LineChartPreviewStoreOptions =
  | { activeOnRoute: Route; activeOnSwipeRoute?: never }
  | { activeOnRoute?: never; activeOnSwipeRoute: SwipeRoute };

type LineChartPreviewParams = { chartIds: string[] };
type LineChartPreviewStoreState = LineChartPreviewSource & { subscribedChartIds: string[] };
type LineChartPreviewQueryState = QueryStoreState<LineChartPreviewFetchResult, LineChartPreviewParams, LineChartPreviewStoreState>;

// ============ Constants ====================================================== //

const CACHE_TIME = time.minutes(2);
const STALE_TIME = time.minutes(1);

// ============ Store Factory ================================================== //

/**
 * Creates a query store that tracks mounted chart reads and refreshes only stale chart ids.
 */
export function createLineChartPreviewStore(
  fetchLineChartPreviews: LineChartPreviewFetcher,
  options?: LineChartPreviewStoreOptions
): QueryStore<LineChartPreviewFetchResult, LineChartPreviewParams, LineChartPreviewStoreState> {
  const subscriptionCountByChartId = new Map<string, number>();
  let collectedChartReads: ChartReads | null = null;

  const store = createQueryStore<LineChartPreviewFetchResult, LineChartPreviewParams, LineChartPreviewStoreState>(
    {
      fetcher: fetchStaleLineChartPreviews,
      setData: setLineChartPreviewData,
      enabled: buildNavigationEnabled(options),
      params: {
        chartIds: ($, store) => $(store, s => s.subscribedChartIds),
      },
      staleTime: STALE_TIME,
      cacheTime: CACHE_TIME,
      keepPreviousData: true,
      paramChangeThrottle: time.seconds(1),
    },

    (_, get) => ({
      getChartData: id => {
        trackChartRead(id);
        return selectChartData(get().queryCache, id);
      },
      subscribedChartIds: [],
    })
  );

  const emptyFetchResult = Object.freeze<LineChartPreviewFetchResult>({});

  async function fetchStaleLineChartPreviews(
    { chartIds }: LineChartPreviewParams,
    abortController: AbortController | null
  ): Promise<LineChartPreviewFetchResult> {
    const staleChartIds = selectStaleChartIds(store.getState(), chartIds);
    if (!staleChartIds.length) return emptyFetchResult;

    return fetchLineChartPreviews(staleChartIds, abortController);
  }

  function trackChartRead(id: string): void {
    if (collectedChartReads === null) return;

    if (collectedChartReads === undefined) {
      collectedChartReads = id;
    } else if (typeof collectedChartReads === 'string') {
      if (collectedChartReads !== id) collectedChartReads = [collectedChartReads, id];
    } else if (!collectedChartReads.includes(id)) {
      collectedChartReads.push(id);
    }
  }

  function collectChartReads(read: () => void): ChartReads {
    collectedChartReads = undefined;
    try {
      read();
      return collectedChartReads;
    } finally {
      collectedChartReads = null;
    }
  }

  function updateSubscribedChartIds(): void {
    const subscribedChartIds = getConsistentArray([...subscriptionCountByChartId.keys()]);

    store.setState(state => {
      if (!subscribedChartIds.length) return { subscribedChartIds };

      const missingChartFetchTime = Date.now() - STALE_TIME;
      const queryCache = { ...state.queryCache };

      queryCache[getQueryKey({ chartIds: subscribedChartIds })] = buildCacheEntry(
        null,
        getOldestChartFetchTime(subscribedChartIds, queryCache, missingChartFetchTime)
      );

      return { queryCache, subscribedChartIds };
    });
  }

  function incrementChartSubscriptionCount(id: string): void {
    const currentCount = subscriptionCountByChartId.get(id) ?? 0;
    subscriptionCountByChartId.set(id, currentCount + 1);

    if (currentCount === 0) updateSubscribedChartIds();
  }

  function decrementChartSubscriptionCount(id: string): void {
    const currentCount = subscriptionCountByChartId.get(id);
    if (!currentCount) return;

    const isLastSubscription = currentCount === 1;

    if (isLastSubscription) {
      subscriptionCountByChartId.delete(id);
      updateSubscribedChartIds();
    } else {
      subscriptionCountByChartId.set(id, currentCount - 1);
    }
  }

  const originalSubscribe: SubscribeOverloads<LineChartPreviewQueryState, true> = store.subscribe;

  store.subscribe = (...args: SubscribeArgs<LineChartPreviewQueryState>) => {
    const chartReads = args.length === 1 ? undefined : collectChartReads(() => args[0](store.getState()));
    forEachChartRead(chartReads, incrementChartSubscriptionCount);

    const unsubscribe = args.length === 1 ? originalSubscribe(args[0]) : originalSubscribe(...args);
    if (!chartReads) return unsubscribe;

    let didUnsubscribe = false;
    return (skipAbortFetch?: boolean) => {
      if (didUnsubscribe) return;
      didUnsubscribe = true;
      unsubscribe(skipAbortFetch);
      forEachChartRead(chartReads, decrementChartSubscriptionCount);
    };
  };

  return store;
}

// ============ Navigation ===================================================== //

function buildNavigationEnabled(
  options: LineChartPreviewStoreOptions | undefined
): ReactiveParam<boolean, LineChartPreviewParams, LineChartPreviewQueryState, LineChartPreviewFetchResult> {
  if (!options) return true;

  if (options.activeOnRoute !== undefined) {
    const { activeOnRoute } = options;
    return $ => $(useNavigationStore, state => state.isRouteActive(activeOnRoute));
  }

  const { activeOnSwipeRoute } = options;
  return $ => $(useNavigationStore, state => state.isSwipeRouteActive(activeOnSwipeRoute));
}

// ============ Chart Reads ==================================================== //

type ChartReads = string | string[] | undefined;

function forEachChartRead(chartReads: ChartReads, visit: (id: string) => void): void {
  if (!chartReads) return;
  if (typeof chartReads === 'string') visit(chartReads);
  else chartReads.forEach(visit);
}

// ============ Data Setter ==================================================== //

function setLineChartPreviewData({
  data,
  params,
  queryKey,
  set,
}: SetDataParams<LineChartPreviewFetchResult, LineChartPreviewParams, LineChartPreviewStoreState>): void {
  set(state => {
    const lastFetchedAt = Date.now();
    const queryCache = { ...state.queryCache };

    for (const id of Object.keys(data)) {
      const nextData = data[id];
      if (nextData === undefined) continue;

      const currentData = selectChartData(queryCache, id);
      const chartData = currentData && nextData && isLineChartPreviewDataEqual(currentData, nextData) ? currentData : nextData;
      queryCache[getChartQueryKey(id)] = buildCacheEntry({ [id]: chartData }, lastFetchedAt);
    }

    queryCache[queryKey] = buildCacheEntry(null, getOldestChartFetchTime(params.chartIds, queryCache, lastFetchedAt));

    return { queryCache };
  });
}

// ============ Cache Helpers ================================================== //

function selectStaleChartIds(state: LineChartPreviewQueryState, chartIds: readonly string[]): string[] {
  const now = Date.now();
  return chartIds.filter(id => isChartStale(state.queryCache[getChartQueryKey(id)], now));
}

function selectChartData(queryCache: LineChartPreviewQueryState['queryCache'], id: string): LineChartPreviewData | undefined {
  return queryCache[getChartQueryKey(id)]?.data?.[id] ?? undefined;
}

function isChartStale(cacheEntry: CacheEntry<LineChartPreviewFetchResult> | undefined, now: number): boolean {
  return !cacheEntry?.lastFetchedAt || now - cacheEntry.lastFetchedAt >= STALE_TIME;
}

function getOldestChartFetchTime(
  chartIds: readonly string[],
  queryCache: LineChartPreviewQueryState['queryCache'],
  fallbackFetchTime: number
): number {
  let oldestFetchTime: number | undefined;

  for (const id of chartIds) {
    const chartFetchTime = queryCache[getChartQueryKey(id)]?.lastFetchedAt ?? fallbackFetchTime;
    if (oldestFetchTime === undefined || chartFetchTime < oldestFetchTime) oldestFetchTime = chartFetchTime;
  }

  return oldestFetchTime ?? fallbackFetchTime;
}

function getChartQueryKey(id: string): string {
  return getQueryKey({ chartId: id });
}

function buildCacheEntry(data: LineChartPreviewFetchResult | null, lastFetchedAt: number): CacheEntry<LineChartPreviewFetchResult> {
  return {
    cacheTime: CACHE_TIME,
    data,
    errorInfo: null,
    lastFetchedAt,
  };
}

// ============ Comparisons ==================================================== //

function isLineChartPreviewDataEqual(current: LineChartPreviewData, next: LineChartPreviewData): boolean {
  return areNumberArraysEqual(current.prices, next.prices) && areNumberArraysEqual(current.timestamps, next.timestamps);
}

function areNumberArraysEqual(current: ArrayLike<number>, next: ArrayLike<number>): boolean {
  if (current.length !== next.length) return false;

  for (let i = 0; i < current.length; i++) {
    if (current[i] !== next[i]) return false;
  }

  return true;
}
