import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest';

import '../../../../config/test/storeEnvironment';

import { polymarketClobDataClient } from '@/features/polymarket/polymarket-clob-data-client';
import { usePolymarketFeeInfoStore } from '@/features/polymarket/stores/polymarketFeeInfoStore';
import { usePolymarketOrderBookStore, type OrderBook } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { polymarketOrderParamsStore, usePolymarketOrderDetailsStore } from '@/features/polymarket/stores/polymarketOrderStore';
import { type Selection } from '@/features/sports/core/generated/sports';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

import { predictionEvent } from '../../../../config/test/predictionEvent';

const tokenId = '61682588409713156892865066024379723903051700030517382076759724382208757063880';
const otherTokenId = '61682588409713156892865066024379723903051700030517382076759724382208757063881';
const selection: Selection = { eventId: '980884', marketId: '4322152', tokenId, outcomeIndex: 1 };
const fetchMock = vi.spyOn(global, 'fetch');
const marketInfo = vi.spyOn(polymarketClobDataClient, 'getClobMarketInfo');
const stops: (() => void)[] = [];

function eventResponse(selected: Selection = selection): Response {
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

beforeEach(() => {
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_NEW_POSITION_SHEET });
  polymarketOrderParamsStore.setState({ params: null });
  usePolymarketOrderDetailsStore.setState({ queryCache: {}, lastFetchedAt: null, error: null, status: 'idle' });
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
    usePolymarketOrderDetailsStore.subscribe(() => undefined),
    usePolymarketOrderBookStore.subscribe(() => undefined),
    usePolymarketFeeInfoStore.subscribe(() => undefined)
  );
});
afterEach(() => {
  for (const stop of stops.splice(0)) stop();
});
afterAll(() => {
  for (const store of [usePolymarketOrderDetailsStore, usePolymarketOrderBookStore, usePolymarketFeeInfoStore])
    store.getState().reset(true);
  fetchMock.mockRestore();
  marketInfo.mockRestore();
});

it.each(['known', 'selected'])('keeps a cold selection’s book and fees consistent after a %s order', async previous => {
  polymarketOrderParamsStore.setState({ params: previous === 'known' ? { tokenId, conditionId: 'known' } : selection });
  await settle();
  expect(usePolymarketOrderBookStore.getState().getData()?.asset_id).toBe(tokenId);
  expect(usePolymarketFeeInfoStore.getState().getData()?.platformFeeRate).toBe(0.02);

  const next: Selection = { eventId: '980885', marketId: '4322153', tokenId: '200', outcomeIndex: 1 };
  const metadata = Promise.withResolvers<Response>();
  marketInfo.mockClear();
  fetchMock.mockImplementation(async url => {
    const request = new URL(String(url));
    if (request.pathname === `/events/${next.eventId}`) return metadata.promise;
    if (request.pathname.endsWith('/book')) return bookResponse(request.searchParams.get('token_id') ?? '');
    throw new Error(`Unexpected order request: ${request.pathname}`);
  });
  polymarketOrderParamsStore.setState({ params: next });
  await settle();
  expect(usePolymarketOrderBookStore.getState().getData()?.asset_id).toBe('200');
  expect(usePolymarketOrderDetailsStore.getState().getData()).toBeNull();
  expect(marketInfo).not.toHaveBeenCalled();

  metadata.resolve(eventResponse(next));
  await settle();
  expect(usePolymarketOrderDetailsStore.getState().getData()).toMatchObject({
    market: { conditionId: 'condition-4322153', clobTokenIds: [otherTokenId, '200'] },
    outcomeIndex: 1,
  });
  expect(marketInfo).toHaveBeenCalledWith('condition-4322153');
  expect(usePolymarketFeeInfoStore.getState().getData()?.platformFeeRate).toBe(0.02);
});

it.each([{ active: false }, { closed: true }, { archived: true }, { acceptingOrders: false }])(
  'rejects an unavailable market: %j',
  async flags => {
    const event = predictionEvent(selection.eventId);
    Object.assign(event.markets[0], { id: selection.marketId, clobTokenIds: JSON.stringify([otherTokenId, tokenId]), ...flags });
    fetchMock.mockImplementation(async url =>
      String(url).includes('/events/')
        ? new Response(JSON.stringify(event), { headers: { 'Content-Type': 'application/json' } })
        : bookResponse(tokenId)
    );
    polymarketOrderParamsStore.setState({ params: selection });
    await settle();
    expect(usePolymarketOrderDetailsStore.getState().getData()).toBeNull();
    expect(marketInfo).not.toHaveBeenCalled();
  }
);

it('rejects a token at a different outcome index', async () => {
  polymarketOrderParamsStore.setState({ params: { ...selection, outcomeIndex: 0 } });
  await settle();
  expect(usePolymarketOrderDetailsStore.getState().getData()).toBeNull();
  expect(marketInfo).not.toHaveBeenCalled();
});
