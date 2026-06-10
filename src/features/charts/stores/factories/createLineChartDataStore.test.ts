import { time } from '@/framework/core/utils/time';
import Routes, { type Route } from '@/navigation/routesNames';
import { useNavigationStore, type SwipeRoute } from '@/state/navigation/navigationStore';

import { type CompactLineChartData } from '../../line/compact/types';
import { createLineChartDataStore, type FetchedLineChartData } from './createLineChartDataStore';

jest.mock('@/navigation/virtualNavigators', () => ({
  VIRTUAL_NAVIGATORS: {},
}));

describe('createLineChartDataStore', () => {
  it('wrapped chart reads are correctly tracked', () => {
    const store = createLineChartDataStore(async () => ({}));

    const unsubscribe = store.subscribe(
      state => {
        const selectChart = () => state.getChartData('BTC');
        return selectChart();
      },
      () => undefined
    );

    expect(store.getState().subscribedChartIds).toEqual(['BTC']);

    unsubscribe();

    expect(store.getState().subscribedChartIds).toEqual([]);

    store.getState().reset(true);
  });

  it('counts subscription only once when a selector reads the same chart twice', () => {
    const store = createLineChartDataStore(async () => ({}));

    const unsubscribe = store.subscribe(
      state => {
        state.getChartData('BTC');
        return state.getChartData('BTC');
      },
      () => undefined
    );
    expect(store.getState().subscribedChartIds).toEqual(['BTC']);

    unsubscribe();
    expect(store.getState().subscribedChartIds).toEqual([]);

    store.getState().reset(true);
  });

  it('moves a live selector subscription when its chart id changes', () => {
    const store = createLineChartDataStore(async () => ({}));
    let chartId = 'BTC';

    const unsubscribe = store.subscribe(
      state => state.getChartData(chartId),
      () => undefined
    );
    expect(store.getState().subscribedChartIds).toEqual(['BTC']);

    chartId = 'ETH';
    store.setState(state => ({ queryCache: state.queryCache }));
    expect(store.getState().subscribedChartIds).toEqual(['ETH']);

    unsubscribe();
    expect(store.getState().subscribedChartIds).toEqual([]);

    store.getState().reset(true);
  });

  it('notifies chart listeners from query cache updates', async () => {
    const store = createLineChartDataStore(fetchChartData);
    const listener = jest.fn();

    const unsubscribe = store.subscribe(state => state.getChartData('BTC'), listener);

    await store.getState().fetch({ chartIds: ['BTC'] }, { force: true });
    expect(listener.mock.calls[0]?.[0]).toEqual(buildChartData(3));

    unsubscribe();
    store.getState().reset(true);
  });

  it('does not refetch fresh charts when active batches change', async () => {
    const now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    const fetchLineChartData = jest.fn(fetchChartData);
    const store = createLineChartDataStore(fetchLineChartData);

    try {
      await store.getState().fetch({ chartIds: ['BTC'] }, { force: true });
      expect(fetchLineChartData.mock.calls[0]?.[0]).toEqual(['BTC']);
      expect(store.getState().getChartData('BTC')).toEqual(buildChartData(3));

      await store.getState().fetch({ chartIds: ['BTC', 'ETH'] }, { force: true });
      expect(fetchLineChartData.mock.calls[1]?.[0]).toEqual(['ETH']);
      expect(store.getState().isStale()).toBe(false);
    } finally {
      store.getState().reset(true);
      jest.restoreAllMocks();
    }
  });

  it('uses configured stale time when filtering chart ids to fetch', async () => {
    let now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    const fetchLineChartData = jest.fn(fetchChartData);
    const store = createLineChartDataStore(fetchLineChartData, { staleTime: time.minutes(7) });

    try {
      await store.getState().fetch({ chartIds: ['BTC'] }, { force: true });

      now += time.minutes(5);
      await store.getState().fetch({ chartIds: ['BTC', 'ETH'] }, { force: true });
      expect(fetchLineChartData.mock.calls[1]?.[0]).toEqual(['ETH']);

      now += time.minutes(3);
      await store.getState().fetch({ chartIds: ['BTC', 'ETH'] }, { force: true });
      expect(fetchLineChartData.mock.calls[2]?.[0]).toEqual(['BTC']);
    } finally {
      store.getState().reset(true);
      jest.restoreAllMocks();
    }
  });

  it('seeds active batch freshness from chart cache when demand changes', async () => {
    const now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    const store = createLineChartDataStore(fetchChartData);

    await store.getState().fetch({ chartIds: ['BTC'] }, { force: true });
    await store.getState().fetch({ chartIds: ['ETH'] }, { force: true });

    const unsubscribeBtc = store.subscribe(
      state => state.getChartData('BTC'),
      () => undefined
    );
    const unsubscribeEth = store.subscribe(
      state => state.getChartData('ETH'),
      () => undefined
    );

    expect(store.getState().getCacheEntry({ chartIds: ['BTC', 'ETH'] })?.lastFetchedAt).toBe(now);
    expect(store.getState().isStale()).toBe(false);

    unsubscribeBtc();
    unsubscribeEth();
    store.getState().reset(true);
    jest.restoreAllMocks();
  });

  it('gates fetching to the configured navigation scope', async () => {
    const previousRoute = useNavigationStore.getState().activeRoute;
    const previousSwipeRoute = useNavigationStore.getState().activeSwipeRoute;

    const routeFetcher = jest.fn(fetchChartData);
    const swipeFetcher = jest.fn(fetchChartData);
    const resetStores: (() => void)[] = [];

    try {
      setNavigationState(Routes.WALLET_SCREEN, Routes.WALLET_SCREEN);

      const routeStore = createLineChartDataStore(routeFetcher, { activeOnRoute: Routes.DISCOVER_SCREEN });
      resetStores.push(() => routeStore.getState().reset(true));

      await routeStore.getState().fetch({ chartIds: ['BTC'] });
      expect(routeFetcher).not.toHaveBeenCalled();

      setNavigationState(Routes.DISCOVER_SCREEN, Routes.DISCOVER_SCREEN);
      await routeStore.getState().fetch({ chartIds: ['BTC'] });
      expect(routeFetcher.mock.calls[0]?.[0]).toEqual(['BTC']);

      const swipeStore = createLineChartDataStore(swipeFetcher, { activeOnSwipeRoute: Routes.DISCOVER_SCREEN });
      resetStores.push(() => swipeStore.getState().reset(true));

      setNavigationState(Routes.PERPS_DETAIL_SCREEN, Routes.DISCOVER_SCREEN);
      await swipeStore.getState().fetch({ chartIds: ['ETH'] });
      expect(swipeFetcher.mock.calls[0]?.[0]).toEqual(['ETH']);

      setNavigationState(Routes.WALLET_SCREEN, Routes.WALLET_SCREEN);
      await swipeStore.getState().fetch({ chartIds: ['SOL'] });
      expect(swipeFetcher).toHaveBeenCalledTimes(1);
    } finally {
      resetStores.forEach(resetStore => resetStore());
      setNavigationState(previousRoute, previousSwipeRoute);
    }
  });
});

function setNavigationState(activeRoute: Route, activeSwipeRoute: SwipeRoute): void {
  useNavigationStore.setState({ activeRoute, activeSwipeRoute });
}

async function fetchChartData(chartIds: readonly string[]): Promise<FetchedLineChartData> {
  const charts: FetchedLineChartData = {};

  for (const id of chartIds) {
    charts[id] = buildChartData(id.length);
  }

  return charts;
}

function buildChartData(value: number): CompactLineChartData {
  return {
    prices: new Float32Array([value]),
    timestamps: new Uint32Array([value]),
  };
}
