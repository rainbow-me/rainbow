import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest';

import '../../../../config/test/storeEnvironment';

import { polymarketClobDataClient } from '@/features/polymarket/polymarket-clob-data-client';
import { usePolymarketFeeInfoStore } from '@/features/polymarket/stores/polymarketFeeInfoStore';
import { usePolymarketOrderBookStore, type OrderBook } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { usePolymarketOrderStore } from '@/features/polymarket/stores/polymarketOrderStore';
import { type PolymarketOutcome } from '@/features/sports/core/generated/sports';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

import { predictionEvent } from '../../../../config/test/predictionEvent';

const tokenId = '61682588409713156892865066024379723903051700030517382076759724382208757063880';
const otherTokenId = '61682588409713156892865066024379723903051700030517382076759724382208757063881';
const outcome: PolymarketOutcome = { eventId: '980884', marketId: '4322152', tokenId, outcomeIndex: 1 };
const fetchMock = vi.spyOn(global, 'fetch');
const marketInfo = vi.spyOn(polymarketClobDataClient, 'getClobMarketInfo');
const stops: (() => void)[] = [];

function eventResponse(selected: PolymarketOutcome = outcome): Response {
  const event = predictionEvent(selected.eventId);
  Object.assign(event.markets[0], {
    id: selected.marketId,
    conditionId: `condition-${selected.marketId}`,
    outcomes: '["Other","Chosen"]',
    clobTokenIds: JSON.stringify([otherTokenId, selected.tokenId]),
  });
  event.markets.unshift({ ...event.markets[0], id: 'unrelated', conditionId: 'unrelated', clobTokenIds: '["300","301"]' });
  return new Response(JSON.stringify(event), { headers: { 'Content-Type': 'application/json' } });
}

function bookResponse(id: string): Response {
  const book: OrderBook = {
    market: 'condition',
    asset_id: id,
    timestamp: '1000',
    hash: 'hash',
    bids: [],
    asks: [],
    min_order_size: '1',
    tick_size: '0.01',
    neg_risk: false,
  };
  return new Response(JSON.stringify(book), { headers: { 'Content-Type': 'application/json' } });
}

function settle(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}

function stallOrderDetails(): void {
  fetchMock.mockImplementation(async (url, options) => {
    if (!String(url).includes('/events/')) return bookResponse(tokenId);
    return new Promise<Response>((_, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
  });
}

beforeEach(() => {
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_NEW_POSITION_SHEET });
  usePolymarketOrderStore.setState({ params: null, queryCache: {}, lastFetchedAt: null, error: null, status: 'idle' });
  usePolymarketOrderBookStore.setState({ queryCache: {}, lastFetchedAt: null, error: null, status: 'idle' });
  usePolymarketFeeInfoStore.setState({ queryCache: {}, lastFetchedAt: null, error: null, status: 'idle' });
  marketInfo.mockReset().mockImplementation(async condition => ({
    c: condition,
    t: [
      { t: otherTokenId, o: 'Other' },
      { t: tokenId, o: 'Chosen' },
    ],
    mts: 0.01,
    r: null,
    mos: 1,
    fd: { r: 0.02, e: 1 },
  }));
  fetchMock.mockReset().mockImplementation(async url => {
    const request = new URL(String(url));
    return request.pathname.endsWith('/book') ? bookResponse(request.searchParams.get('token_id') ?? '') : eventResponse();
  });
  stops.push(
    usePolymarketOrderStore.subscribe(() => undefined),
    usePolymarketOrderBookStore.subscribe(() => undefined),
    usePolymarketFeeInfoStore.subscribe(() => undefined)
  );
});
afterEach(() => {
  for (const stop of stops.splice(0)) stop();
  vi.useRealTimers();
});
afterAll(() => {
  for (const store of [usePolymarketOrderStore, usePolymarketOrderBookStore, usePolymarketFeeInfoStore]) store.getState().reset(true);
  fetchMock.mockRestore();
  marketInfo.mockRestore();
});

it.each(['known', 'selected'])('keeps a cold outcome’s book and fees consistent after a %s order', async previous => {
  usePolymarketOrderStore.setState({ params: previous === 'known' ? { tokenId, conditionId: 'known' } : outcome });
  await settle();
  expect(usePolymarketOrderBookStore.getState().getData()?.asset_id).toBe(tokenId);
  expect(usePolymarketFeeInfoStore.getState().getData()?.platformFeeRate).toBe(0.02);

  const next: PolymarketOutcome = { eventId: '980885', marketId: '4322153', tokenId: '200', outcomeIndex: 1 };
  const metadata = Promise.withResolvers<Response>();
  marketInfo.mockClear();
  fetchMock.mockImplementation(async url => {
    const request = new URL(String(url));
    if (request.pathname === `/events/${next.eventId}`) return metadata.promise;
    if (request.pathname.endsWith('/book')) return bookResponse(request.searchParams.get('token_id') ?? '');
    throw new Error(`Unexpected order request: ${request.pathname}`);
  });
  usePolymarketOrderStore.setState({ params: next });
  await settle();
  expect(usePolymarketOrderBookStore.getState().getData()?.asset_id).toBe('200');
  expect(usePolymarketOrderStore.getState().getData()).toBeNull();
  expect(marketInfo).not.toHaveBeenCalled();

  metadata.resolve(eventResponse(next));
  await settle();
  expect(usePolymarketOrderStore.getState().getData()).toMatchObject({
    market: { conditionId: 'condition-4322153', clobTokenIds: [otherTokenId, '200'] },
    outcomeIndex: 1,
  });
  expect(marketInfo).toHaveBeenCalledWith('condition-4322153');
  expect(usePolymarketFeeInfoStore.getState().getData()?.platformFeeRate).toBe(0.02);
});

it('reuses order details when only the snapshot price changes', async () => {
  const store = usePolymarketOrderStore.getState();
  store.setBuyParams({ outcome: { ...outcome, price: '0' } });
  await settle();

  const details = usePolymarketOrderStore.getState().getData();
  expect(details?.market.conditionId).toBe(`condition-${outcome.marketId}`);
  fetchMock.mockClear();

  store.setBuyParams({ outcome: { ...outcome, price: '0.6' } });
  await settle();

  expect(usePolymarketOrderStore.getState().getData()).toBe(details);
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([{ active: false }, { closed: true }, { archived: true }, { acceptingOrders: false }])(
  'rejects an unavailable market: %j',
  async flags => {
    const event = predictionEvent(outcome.eventId);
    Object.assign(event.markets[0], { id: outcome.marketId, clobTokenIds: JSON.stringify([otherTokenId, tokenId]), ...flags });
    fetchMock.mockImplementation(async url =>
      String(url).includes('/events/')
        ? new Response(JSON.stringify(event), { headers: { 'Content-Type': 'application/json' } })
        : bookResponse(tokenId)
    );
    usePolymarketOrderStore.setState({ params: outcome });
    await settle();
    expect(usePolymarketOrderStore.getState().getData()).toBeNull();
    expect(marketInfo).not.toHaveBeenCalled();
  }
);

it('rejects a token at a different outcome index', async () => {
  usePolymarketOrderStore.setState({ params: { ...outcome, outcomeIndex: 0 } });
  await settle();
  expect(usePolymarketOrderStore.getState().getData()).toBeNull();
  expect(marketInfo).not.toHaveBeenCalled();
});

it('reports a details timeout as an error and allows retrying', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  stallOrderDetails();
  usePolymarketOrderStore.setState({ params: outcome });
  await settle();

  await vi.advanceTimersByTimeAsync(15_000);
  expect(usePolymarketOrderStore.getState().getStatus()).toMatchObject({
    isError: true,
    isInitialLoad: false,
    isLoading: false,
  });

  fetchMock.mockResolvedValueOnce(eventResponse());
  await usePolymarketOrderStore.getState().fetch({ outcome }, { force: true });
  expect(usePolymarketOrderStore.getState().getStatus('isSuccess')).toBe(true);
});

it('cancels the details request without an error when the sheet closes', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  stallOrderDetails();
  usePolymarketOrderStore.setState({ params: outcome });
  await settle();
  const signal = fetchMock.mock.calls.find(([url]) => String(url).includes('/events/'))?.[1]?.signal;
  expect(signal?.aborted).toBe(false);

  useNavigationStore.setState({ activeRoute: Routes.WALLET_SCREEN });
  await settle();
  expect(signal?.aborted).toBe(true);
  expect(usePolymarketOrderStore.getState().getStatus('isError')).toBe(false);
});
