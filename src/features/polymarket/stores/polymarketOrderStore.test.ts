import { polymarketClobDataClient } from '@/features/polymarket/polymarket-clob-data-client';
import { polymarketEventIdStore } from '@/features/polymarket/stores/polymarketEventIdStore';
import { usePolymarketFeeInfoStore } from '@/features/polymarket/stores/polymarketFeeInfoStore';
import { usePolymarketOrderBookStore } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { polymarketOrderParamsStore, usePolymarketOrderDetailsStore } from '@/features/polymarket/stores/polymarketOrderStore';
import { type Selection } from '@/features/sports/core/generated/sports';
import { rainbowFetch, type RainbowFetchResponse } from '@/framework/data/http/rainbowFetch';
import { prefetchRoute } from '@/navigation/prefetchRegistry';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

jest.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_GAMMA_API_URL: 'https://gamma.test',
  POLYMARKET_CLOB_PROXY_URL: 'https://clob.test',
}));
jest.mock('@/features/polymarket/polymarket-clob-data-client', () => ({
  polymarketClobDataClient: { getClobMarketInfo: jest.fn().mockResolvedValue({ mos: 1, fd: { r: 0, e: 1 } }) },
}));
jest.mock('@/framework/data/http/rainbowFetch', () => ({ rainbowFetch: jest.fn() }));
jest.mock('@/state/navigation/navigationStore', () => ({
  useNavigationStore: jest.requireActual('@storesjs/stores').createBaseStore(() => ({ activeRoute: 'SportsScreen' })),
}));
jest.mock('@/features/charts/polymarket/stores/polymarketStore', () => ({}));
jest.mock('@/features/charts/stores/candlestickStore', () => ({}));
jest.mock('@/features/perps/stores/perpAnnotationsStore', () => ({}));

const tokenId = '61682588409713156892865066024379723903051700030517382076759724382208757063880';
const otherTokenId = '61682588409713156892865066024379723903051700030517382076759724382208757063881';
const selection: Selection = { eventId: '980884', marketId: '4322152', tokenId, outcomeIndex: 1 };

function source() {
  const market = {
    id: selection.marketId,
    conditionId: 'condition',
    active: true,
    closed: false,
    archived: false,
    acceptingOrders: true,
    outcomes: '["Other","Chosen"]',
    clobTokenIds: JSON.stringify([otherTokenId, tokenId]),
  };
  return {
    id: selection.eventId,
    title: 'First vs Second',
    slug: 'match',
    markets: [{ ...market, id: '4322151', conditionId: 'unrelated-condition', clobTokenIds: '["300","301"]' }, market],
  };
}

function response<T>(data: T): RainbowFetchResponse<T> {
  return { data, headers: new Headers(), status: 200 };
}

function settle(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}

let stop: (() => void)[];

beforeEach(async () => {
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_NEW_POSITION_SHEET });
  usePolymarketOrderDetailsStore.setState({ queryCache: {}, lastFetchedAt: null, status: 'idle' });
  usePolymarketOrderBookStore.setState({ queryCache: {}, lastFetchedAt: null, status: 'idle' });
  usePolymarketFeeInfoStore.setState({ queryCache: {}, lastFetchedAt: null, status: 'idle' });
  polymarketOrderParamsStore.setState({ params: null });
  polymarketEventIdStore.setState({ eventId: 'parent' });
  jest.clearAllMocks();
  jest
    .mocked(rainbowFetch)
    .mockReset()
    .mockImplementation(async url => response(String(url).includes('/book?') ? { asset_id: tokenId } : source()));
  await settle();
  stop = [
    usePolymarketOrderDetailsStore.subscribe(() => undefined),
    usePolymarketOrderBookStore.subscribe(() => undefined),
    usePolymarketFeeInfoStore.subscribe(() => undefined),
  ];
});

afterEach(() => {
  stop.forEach(unsubscribe => unsubscribe());
});

afterAll(() => {
  usePolymarketOrderDetailsStore.getState().reset(true);
  usePolymarketOrderBookStore.getState().reset(true);
  usePolymarketFeeInfoStore.getState().reset(true);
});

it('uses one selection for the book and resolved fees without changing the event screen', async () => {
  let finish!: (value: RainbowFetchResponse<ReturnType<typeof source>>) => void;
  jest.mocked(rainbowFetch).mockImplementation(url =>
    String(url).includes('/events/')
      ? new Promise(resolve => {
          finish = resolve;
        })
      : Promise.resolve(response({ asset_id: tokenId }))
  );

  prefetchRoute(Routes.POLYMARKET_NEW_POSITION_SHEET, { selection, fromRoute: Routes.SPORTS_SCREEN });
  await settle();

  expect(rainbowFetch).toHaveBeenCalledWith(`https://clob.test/book?token_id=${tokenId}`, expect.any(Object));
  expect(polymarketClobDataClient.getClobMarketInfo).not.toHaveBeenCalled();
  expect(usePolymarketOrderDetailsStore.getState().getData({ selection })).toBeNull();

  finish(response(source()));
  await settle();

  expect(usePolymarketOrderDetailsStore.getState().getData({ selection })).toEqual({
    event: { title: 'First vs Second', slug: 'match' },
    market: expect.objectContaining({ conditionId: 'condition', clobTokenIds: [otherTokenId, tokenId] }),
    outcomeIndex: 1,
  });
  expect(polymarketClobDataClient.getClobMarketInfo).toHaveBeenCalledWith('condition');
  expect(polymarketEventIdStore.getState().eventId).toBe('parent');
});

it('loads known book and fee inputs together without fetching an event, including after a Sports selection', async () => {
  polymarketOrderParamsStore.setState({ params: selection });
  await settle();
  jest.mocked(rainbowFetch).mockClear();
  jest.mocked(polymarketClobDataClient.getClobMarketInfo).mockClear();

  polymarketOrderParamsStore.setState({ params: { tokenId: 'known-token', conditionId: 'known-condition' } });
  await settle();

  expect(rainbowFetch).toHaveBeenCalledTimes(1);
  expect(rainbowFetch).toHaveBeenCalledWith('https://clob.test/book?token_id=known-token', expect.any(Object));
  expect(polymarketClobDataClient.getClobMarketInfo).toHaveBeenCalledWith('known-condition');
  expect(usePolymarketOrderDetailsStore.getState().enabled).toBe(false);
});

it.each([{ active: false }, { closed: true }, { archived: true }, { acceptingOrders: false }])(
  'does not admit an unavailable market: %j',
  async fields => {
    const event = source();
    Object.assign(event.markets[1], fields);
    jest.mocked(rainbowFetch).mockImplementation(async url => response(String(url).includes('/events/') ? event : {}));

    polymarketOrderParamsStore.setState({ params: selection });
    await settle();

    expect(usePolymarketOrderDetailsStore.getState().getCacheEntry({ selection })).toMatchObject({ data: null, errorInfo: null });
    expect(polymarketClobDataClient.getClobMarketInfo).not.toHaveBeenCalled();
  }
);

it('does not substitute another outcome for the requested token and original index', async () => {
  const changedSelection = { ...selection, outcomeIndex: 0 };
  polymarketOrderParamsStore.setState({ params: changedSelection });
  await settle();

  expect(usePolymarketOrderDetailsStore.getState().getCacheEntry({ selection: changedSelection })).toMatchObject({
    data: null,
    errorInfo: null,
  });
  expect(polymarketClobDataClient.getClobMarketInfo).not.toHaveBeenCalled();
});

it('retries a failed metadata read without rebuilding the order input', async () => {
  jest.mocked(rainbowFetch).mockImplementation(async url => {
    if (String(url).includes('/events/')) throw new Error('offline');
    return response({});
  });
  polymarketOrderParamsStore.setState({ params: selection });
  await settle();
  expect(usePolymarketOrderDetailsStore.getState().getCacheEntry({ selection })?.errorInfo?.error.message).toBe('offline');

  jest.mocked(rainbowFetch).mockResolvedValue(response(source()));
  await usePolymarketOrderDetailsStore.getState().fetch({ selection }, { force: true });
  await settle();
  expect(usePolymarketOrderDetailsStore.getState().getData({ selection })?.outcomeIndex).toBe(1);
  expect(polymarketOrderParamsStore.getState().params).toBe(selection);
  expect(polymarketClobDataClient.getClobMarketInfo).toHaveBeenCalledWith('condition');
});

it.each(['known', 'selected'] as const)('derives fees for a new cold selection after a %s order', async previous => {
  polymarketOrderParamsStore.setState({ params: previous === 'known' ? { tokenId, conditionId: 'condition' } : selection });
  await settle();
  jest.mocked(polymarketClobDataClient.getClobMarketInfo).mockClear();

  const next: Selection = { eventId: '980885', marketId: '4322153', tokenId: '200', outcomeIndex: 1 };
  const event = source();
  event.id = next.eventId;
  Object.assign(event.markets[1], { id: next.marketId, conditionId: 'next-condition', clobTokenIds: '["201","200"]' });
  let finish!: (value: RainbowFetchResponse<typeof event>) => void;
  jest.mocked(rainbowFetch).mockImplementation(url =>
    String(url).includes('/events/')
      ? new Promise(resolve => {
          finish = resolve;
        })
      : Promise.resolve(response({ asset_id: next.tokenId }))
  );

  polymarketOrderParamsStore.setState({ params: next });
  await settle();
  expect(usePolymarketOrderDetailsStore.getState().getData({ selection: next })).toBeNull();
  expect(polymarketClobDataClient.getClobMarketInfo).not.toHaveBeenCalled();

  finish(response(event));
  await settle();
  expect(polymarketClobDataClient.getClobMarketInfo).toHaveBeenCalledTimes(1);
  expect(polymarketClobDataClient.getClobMarketInfo).toHaveBeenCalledWith('next-condition');
});

it('keeps cached details but disables their query after the trade screen is left', async () => {
  polymarketOrderParamsStore.setState({ params: selection });
  await settle();
  const details = usePolymarketOrderDetailsStore.getState().getData({ selection });
  expect(details).not.toBeNull();

  useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });
  await settle();
  expect(usePolymarketOrderDetailsStore.getState().enabled).toBe(false);
  expect(usePolymarketOrderDetailsStore.getState().getData({ selection })).toBe(details);
});
