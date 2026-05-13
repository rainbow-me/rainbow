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
import { createSelectorReadTracker } from '@/state/internal/utils/createSelectorReadTracker';
import { useNavigationStore, type SwipeRoute } from '@/state/navigation/navigationStore';
import { time } from '@/utils/time';

import { type CompactLineChartData, type LineChartDataStore } from '../../line/compact/types';

// ============ Types ========================================================== //

type ChartId = string;

/**
 * Fetched line chart data by id. `null` clears a chart; omitted ids keep their current data.
 */
export type FetchedLineChartData = Partial<Record<ChartId, CompactLineChartData | null>>;

/**
 * Loads line chart data for ids that need fresh data.
 */
export type LineChartDataFetcher = (chartIds: readonly ChartId[], abortController: AbortController | null) => Promise<FetchedLineChartData>;

/**
 * Restricts store fetching to an active navigation scope.
 */
export type LineChartDataStoreOptions =
  | { activeOnRoute: Route; activeOnSwipeRoute?: never }
  | { activeOnRoute?: never; activeOnSwipeRoute: SwipeRoute };

type LineChartDataParams = { chartIds: ChartId[] };
type LineChartDataStoreState = LineChartDataStore & { subscribedChartIds: ChartId[] };
type LineChartDataQueryState = QueryStoreState<FetchedLineChartData, LineChartDataParams, LineChartDataStoreState>;

// ============ Constants ====================================================== //

const CACHE_TIME = time.minutes(2);
const STALE_TIME = time.seconds(30);

// ============ Store Factory ================================================== //

/**
 * Creates a query store that tracks mounted chart reads and refreshes only stale chart ids.
 */
export function createLineChartDataStore(
  fetchLineChartData: LineChartDataFetcher,
  options?: LineChartDataStoreOptions
): QueryStore<FetchedLineChartData, LineChartDataParams, LineChartDataStoreState> {
  const chartReadTracker = createSelectorReadTracker<ChartId>();

  const store = createQueryStore<FetchedLineChartData, LineChartDataParams, LineChartDataStoreState>(
    {
      fetcher: fetchStaleLineChartData,
      setData: setLineChartData,
      enabled: buildEnabledSetting(options),
      params: {
        chartIds: ($, store) => $(store, s => s.subscribedChartIds),
      },
      staleTime: STALE_TIME,
      cacheTime: CACHE_TIME,
      keepPreviousData: true,
      paramChangeThrottle: time.seconds(1),
    },

    (_, get) => ({
      subscribedChartIds: [],

      getChartData: id => {
        chartReadTracker.track(id);
        return selectChartData(get().queryCache, id);
      },
    })
  );

  const emptyFetchResult = Object.freeze<FetchedLineChartData>({});

  async function fetchStaleLineChartData(
    { chartIds }: LineChartDataParams,
    abortController: AbortController | null
  ): Promise<FetchedLineChartData> {
    const staleChartIds = selectStaleChartIds(store.getState(), chartIds);
    if (!staleChartIds.length) return emptyFetchResult;

    return fetchLineChartData(staleChartIds, abortController);
  }

  function updateSubscribedChartIds(chartIds: ChartId[]): void {
    const subscribedChartIds = getConsistentArray(chartIds);

    store.setState(state => {
      if (!subscribedChartIds.length) return { subscribedChartIds };

      const staleCutoff = Date.now() - STALE_TIME;
      const nextQueryKey = getQueryKey({ chartIds: subscribedChartIds });
      const queryCache = { ...state.queryCache };

      queryCache[nextQueryKey] = buildCacheEntry(null, getOldestChartFetchTime(subscribedChartIds, queryCache, staleCutoff));

      return { queryCache, subscribedChartIds };
    });
  }

  return chartReadTracker.install(store, updateSubscribedChartIds);
}

// ============ Enabled Setting ================================================ //

function buildEnabledSetting(
  options: LineChartDataStoreOptions | undefined
): ReactiveParam<boolean, LineChartDataParams, LineChartDataQueryState, FetchedLineChartData> {
  if (!options) return true;

  if (options.activeOnRoute !== undefined) {
    const { activeOnRoute } = options;
    return $ => $(useNavigationStore, state => state.isRouteActive(activeOnRoute));
  }

  const { activeOnSwipeRoute } = options;
  return $ => $(useNavigationStore, state => state.isSwipeRouteActive(activeOnSwipeRoute));
}

// ============ Data Setter ==================================================== //

function setLineChartData({
  data,
  params,
  queryKey,
  set,
}: SetDataParams<FetchedLineChartData, LineChartDataParams, LineChartDataStoreState>): void {
  set(state => {
    const lastFetchedAt = Date.now();
    const queryCache = { ...state.queryCache };

    for (const id of Object.keys(data)) {
      const nextData = data[id];
      if (nextData === undefined) continue;

      const chartKey = getChartQueryKey(id);
      const currentData = queryCache[chartKey]?.data?.[id];
      const chartData = currentData && nextData && isLineChartDataEqual(currentData, nextData) ? currentData : nextData;
      queryCache[chartKey] = buildCacheEntry({ [id]: chartData }, lastFetchedAt);
    }

    queryCache[queryKey] = buildCacheEntry(null, getOldestChartFetchTime(params.chartIds, queryCache, lastFetchedAt));

    return { queryCache };
  });
}

// ============ Selectors ====================================================== //

function selectStaleChartIds(state: LineChartDataQueryState, chartIds: readonly ChartId[]): ChartId[] {
  const now = Date.now();
  return chartIds.filter(id => isChartStale(state.queryCache[getChartQueryKey(id)], now));
}

function selectChartData(queryCache: LineChartDataQueryState['queryCache'], id: ChartId): CompactLineChartData | undefined {
  return queryCache[getChartQueryKey(id)]?.data?.[id] ?? undefined;
}

// ============ Cache Helpers ================================================== //

function getChartQueryKey(id: ChartId): string {
  return getQueryKey({ chartId: id });
}

function buildCacheEntry(data: FetchedLineChartData | null, lastFetchedAt: number): CacheEntry<FetchedLineChartData> {
  return { cacheTime: CACHE_TIME, data, errorInfo: null, lastFetchedAt };
}

function isChartStale(cacheEntry: CacheEntry<FetchedLineChartData> | undefined, now: number): boolean {
  return !cacheEntry?.lastFetchedAt || now - cacheEntry.lastFetchedAt >= STALE_TIME;
}

function getOldestChartFetchTime(
  chartIds: readonly ChartId[],
  queryCache: LineChartDataQueryState['queryCache'],
  staleCutoff: number
): number {
  let oldestFetchTime: number | undefined;

  for (const id of chartIds) {
    const chartFetchTime = queryCache[getChartQueryKey(id)]?.lastFetchedAt ?? staleCutoff;
    if (oldestFetchTime === undefined || chartFetchTime < oldestFetchTime) oldestFetchTime = chartFetchTime;
  }

  return oldestFetchTime ?? staleCutoff;
}

// ============ Comparisons ==================================================== //

function isLineChartDataEqual(current: CompactLineChartData, next: CompactLineChartData): boolean {
  return areNumberArraysEqual(current.prices, next.prices) && areNumberArraysEqual(current.timestamps, next.timestamps);
}

function areNumberArraysEqual(current: ArrayLike<number>, next: ArrayLike<number>): boolean {
  if (current.length !== next.length) return false;

  for (let i = 0; i < current.length; i++) {
    if (current[i] !== next[i]) return false;
  }

  return true;
}
