import { getQueryKey } from '@storesjs/stores';
import { type Address } from 'viem';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '../../../../config/test/storeEnvironment';

import { type PolymarketOrderAmounts, type PolymarketPosition, type RawPolymarketPosition } from '@/features/polymarket/types';

import { predictionEvent } from '../../../../config/test/predictionEvent';
import { createEvent, createMarket, createPosition } from '../test/fixtures';
import { type PolymarketMarket } from '../types/polymarket-event';
import { type usePolymarketPositions as PositionsView } from './derived/usePolymarketPositions';
import { type PolymarketOrderDetails } from './polymarketOrderDetailsStore';
import {
  type polymarketPositionsActions as PositionsActions,
  type usePolymarketPositionsStore as PositionsStore,
} from './polymarketPositionsStore';

let usePolymarketPositions: typeof PositionsView;
let usePolymarketPositionsStore: typeof PositionsStore;
let polymarketPositionsActions: typeof PositionsActions;

const mockProxyAddress: Address = '0x1208C8B837F68468457c83DD256e817BD5B3E0b7';
const TEST_CACHE_TIME = 7 * 24 * 60 * 60 * 1_000;

vi.mock('@/features/polymarket/stores/derived/usePolymarketClients', () => ({
  usePolymarketClients: Object.assign(vi.fn(), {
    getInitialState: vi.fn(() => ({ proxyAddress: '0x1208C8B837F68468457c83DD256e817BD5B3E0b7' })),
    getSnapshot: vi.fn(() => ({ proxyAddress: '0x1208C8B837F68468457c83DD256e817BD5B3E0b7' })),
    getState: vi.fn(() => ({ proxyAddress: '0x1208C8B837F68468457c83DD256e817BD5B3E0b7' })),
    subscribe: vi.fn(() => vi.fn()),
  }),
}));

const fetch = vi.spyOn(global, 'fetch');
afterAll(() => fetch.mockRestore());

describe('polymarketPositionsStore', () => {
  beforeEach(async () => {
    fetch.mockReset().mockRejectedValue(new Error('Unexpected positions request'));
    vi.resetModules();
    ({ usePolymarketPositionsStore, polymarketPositionsActions } = await import('./polymarketPositionsStore'));
    ({ usePolymarketPositions } = await import('./derived/usePolymarketPositions'));
    usePolymarketPositionsStore.setState({
      queryKey: getQueryKey({ proxyAddress: mockProxyAddress }),
      queryCache: {},
    });

    await refreshPositions();
    fetch.mockClear();
  });

  afterEach(() => usePolymarketPositionsStore.getState().reset(true));

  it('reads a v2 position using entry cost and unrealized P&L for the open holding', async () => {
    const address = '0x0000000000000000000000000000000000000001';
    const event = predictionEvent('1');
    const market = { ...event.markets[0], events: [event] };
    const holding = {
      proxy_wallet: address,
      token_id: '101',
      redeemable: false,
      slug: market.slug,
      event_id: event.id,
      current_size: 11.7727,
      current_value: 4.7091,
      entry_cost_usdc: 5.1799,
      total_cost_usdc: 5.2669,
      unrealized_pnl: -0.4708,
      total_pnl: -0.5578,
    };
    fetch.mockResolvedValueOnce(Response.json({ data: [holding] })).mockResolvedValueOnce(Response.json([market]));

    const result = await polymarketPositionsActions.fetch({ proxyAddress: address }, { force: true, throwOnError: true });

    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://data-api.polymarket.com/v2/positions');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ user: address, filter_amount: '1' });

    for (const key of ['sort_by', 'sortBy']) {
      expect(url.searchParams.get(key) ?? 'CURRENT_VALUE').toBe('CURRENT_VALUE');
    }

    expect(result?.['101']).toMatchObject({
      proxyWallet: address,
      asset: '101',
      size: 11.7727,
      currentValue: 4.7091,
      initialValue: 5.1799,
      cashPnl: -0.4708,
    });
  });

  it('publishes overlapping buys with their combined cost and preserves them across a stale read', async () => {
    const params = { event: createEvent(), market: createMarket(), outcomeIndex: 0, proxyAddress: mockProxyAddress };
    const onPositions = vi.fn();
    const unsubscribe = usePolymarketPositions.subscribe(state => state.activePositions, onPositions);

    try {
      const first = polymarketPositionsActions.beginBuy({ asset: '101', proxyAddress: mockProxyAddress });
      const second = polymarketPositionsActions.beginBuy({ asset: '101', proxyAddress: mockProxyAddress });
      expect(usePolymarketPositions.getState().activePositions).toEqual([]);

      first.publish(params, { tokens: '2.5', usd: '1' });
      second.publish(params, { tokens: '5', usd: '3' });
      const position = polymarketPositionsActions.getPosition('101', mockProxyAddress);
      expect(position).toMatchObject({ size: 7.5, initialValue: 4, currentValue: 3, cashPnl: -1 });
      expect(usePolymarketPositionsStore.getState().isStale()).toBe(true);

      await flushMicrotasks();
      expect(onPositions.mock.lastCall?.[0]).toMatchObject([{ size: 7.5, initialValue: 4 }]);

      await refreshPositions();
      expect(polymarketPositionsActions.getPosition('101', mockProxyAddress)).toEqual(position);
    } finally {
      unsubscribe();
    }
  });

  it('preserves an earlier correction while a later submission is pending', async () => {
    const params = { event: createEvent(), market: createMarket(), outcomeIndex: 0, proxyAddress: mockProxyAddress };
    const first = applyBuy({ ...params, positionAmounts: { tokens: '10', usd: '4' } });
    const second = polymarketPositionsActions.beginBuy({ asset: '101', proxyAddress: mockProxyAddress });

    first.amend({ tokens: '8', usd: '4' });
    await refreshPositions(createPosition({ size: 8, initialValue: 4 }));

    second.publish(params, { tokens: '5', usd: '2.5' });
    expect(polymarketPositionsActions.getPosition('101', mockProxyAddress)?.size).toBe(13);

    await refreshPositions(createPosition({ size: 13, initialValue: 6.5 }));
    expect(polymarketPositionsActions.getPosition('101', mockProxyAddress)?.size).toBe(13);
  });

  it('does not count a buy twice when the indexer responds before local publication', async () => {
    const buy = polymarketPositionsActions.beginBuy({ asset: '101', proxyAddress: mockProxyAddress });
    const indexed = createPosition({ size: 8, initialValue: 4 });
    await refreshPositions(indexed);
    buy.publish({ event: createEvent(), market: createMarket(), outcomeIndex: 0 }, { tokens: '8', usd: '4' });
    expect(polymarketPositionsActions.getPosition(indexed.asset, mockProxyAddress)?.size).toBe(8);
  });

  it('amends a lower delayed fill and accepts the indexed cost basis', async () => {
    const params = {
      event: createEvent(),
      market: createMarket(),
      outcomeIndex: 0,
      proxyAddress: mockProxyAddress,
    };
    const buy = applyBuy({ ...params, positionAmounts: { tokens: '10', usd: '5' } });
    buy.amend({ tokens: '8', usd: '4' });
    expect(polymarketPositionsActions.getPosition('101', mockProxyAddress)?.size).toBe(8);
    await refreshPositions(createPosition({ size: 8, initialValue: 3.9 }));
    expect(polymarketPositionsActions.getPosition('101', mockProxyAddress)?.initialValue).toBe(3.9);
    buy.amend({ tokens: '9', usd: '4.5' });
    expect(polymarketPositionsActions.getPosition('101', mockProxyAddress)?.size).toBe(8);
  });

  it('does not move an amended buy after a later sale and rebuy', () => {
    const params = { event: createEvent(), market: createMarket(), outcomeIndex: 0, proxyAddress: mockProxyAddress };
    const first = applyBuy({ ...params, positionAmounts: { tokens: '10', usd: '5' } });
    polymarketPositionsActions.remove(createPosition({ size: 10, initialValue: 5 }));
    applyBuy({ ...params, positionAmounts: { tokens: '3', usd: '1.5' } });
    first.amend({ tokens: '8', usd: '4' });
    expect(polymarketPositionsActions.getPosition('101', mockProxyAddress)).toMatchObject({ size: 3, initialValue: 1.5 });
  });

  it('shares overlapping background reads so an older empty response cannot erase a confirmed buy', async () => {
    const params = {
      event: createEvent(),
      market: createMarket(),
      outcomeIndex: 0,
      positionAmounts: { tokens: '10', usd: '4' },
      proxyAddress: mockProxyAddress,
    };
    applyBuy(params);
    usePolymarketPositionsStore.setState({ queryKey: getQueryKey({ proxyAddress: '0x0000000000000000000000000000000000000002' }) });
    const held = Promise.withResolvers<void>();
    fetch.mockImplementationOnce(async () => {
      await held.promise;
      return Response.json({ data: [] });
    });
    const first = usePolymarketPositionsStore.getState().fetch({ proxyAddress: mockProxyAddress }, { force: true, throwOnError: true });
    const second = usePolymarketPositionsStore.getState().fetch({ proxyAddress: mockProxyAddress }, { force: true, throwOnError: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    held.resolve();
    await Promise.all([first, second]);
    expect(polymarketPositionsActions.getPosition('101', mockProxyAddress)?.size).toBe(10);
    await refreshPositions(createPosition());
    expect(polymarketPositionsActions.getPosition('101', mockProxyAddress)).toMatchObject({
      asset: '101',
      proxyWallet: mockProxyAddress,
      size: 10,
      initialValue: 4,
    });

    await refreshPositions();
    expect(polymarketPositionsActions.getPosition('101', mockProxyAddress)).toBeUndefined();
  });

  it('retains an accepted buy across reads for both wallets without changing the selection', async () => {
    const otherProxyAddress = '0x0000000000000000000000000000000000000001';
    usePolymarketPositionsStore.setState({ queryKey: getQueryKey({ proxyAddress: otherProxyAddress }) });

    applyBuy({
      event: createEvent(),
      market: createMarket(),
      outcomeIndex: 0,
      positionAmounts: { tokens: '10', usd: '4' },
      proxyAddress: mockProxyAddress,
    });

    mockPositionsFetch();
    await polymarketPositionsActions.fetch({ proxyAddress: otherProxyAddress }, { force: true, throwOnError: true });
    expect(polymarketPositionsActions.getPosition('101', mockProxyAddress)?.size).toBe(10);

    mockPositionsFetch();
    await polymarketPositionsActions.fetch({ proxyAddress: mockProxyAddress }, { force: true, throwOnError: true });

    expect(usePolymarketPositionsStore.getState().queryKey).toBe(getQueryKey({ proxyAddress: otherProxyAddress }));
    expect(usePolymarketPositionsStore.getState().getPosition('101', otherProxyAddress)).toBeUndefined();
    expect(usePolymarketPositionsStore.getState().getPosition('101', mockProxyAddress)).toMatchObject({
      asset: '101',
      initialValue: 4,
      size: 10,
    });
    expect(usePolymarketPositions.getState().activePositions).toHaveLength(0);
  });

  it('publishes an accepted buy when the route market does not include events', () => {
    const market = createMarketWithoutEvents();

    applyBuy({
      event: createEvent(),
      market,
      outcomeIndex: 0,
      positionAmounts: { tokens: '10', usd: '4' },
      proxyAddress: mockProxyAddress,
    });

    expect(usePolymarketPositionsStore.getState().getPosition('101', mockProxyAddress)).toMatchObject({
      asset: '101',
      eventId: 'event-1',
      eventSlug: 'event-slug',
      market: expect.objectContaining({
        events: [expect.objectContaining({ id: 'event-1', icon: 'https://example.com/event.png', title: 'Will it happen?' })],
      }),
    });
  });

  it('does not invent an absolute position when the proxy cache is not hydrated', async () => {
    usePolymarketPositionsStore.setState({ queryCache: {} });

    applyBuy({
      event: createEvent(),
      market: createMarket(),
      outcomeIndex: 0,
      positionAmounts: { tokens: '5', usd: '2' },
      proxyAddress: mockProxyAddress,
    });

    expect(usePolymarketPositionsStore.getState().getPosition('101', mockProxyAddress)).toBeUndefined();

    const backendPosition = createPosition({ initialValue: 4, size: 10 });
    await refreshPositions(backendPosition);

    expect(usePolymarketPositionsStore.getState().getPosition('101', mockProxyAddress)).toMatchObject({
      initialValue: 4,
      size: 10,
    });
  });

  it('orders positions and preserves the active and lost lists through removals', () => {
    const smallerPosition = createPosition({ asset: 'active-small', currentValue: 2 });
    const largerPosition = createPosition({ asset: 'active-large', currentValue: 8 });
    const winningPosition = createPosition({ currentValue: 10, redeemable: true, size: 10 });
    const lostPosition = createPosition({ asset: '102', currentValue: 0, outcome: 'No', outcomeIndex: 1, redeemable: true });
    usePolymarketPositionsStore.setState({
      queryCache: {
        [getQueryKey({ proxyAddress: mockProxyAddress })]: buildPositionsCacheEntry([
          lostPosition,
          winningPosition,
          smallerPosition,
          largerPosition,
        ]),
      },
    });

    expect(usePolymarketPositions.getState().positions).toEqual([largerPosition, smallerPosition, winningPosition, lostPosition]);
    expect(usePolymarketPositions.getState().activePositions).toEqual([largerPosition, smallerPosition, winningPosition]);
    expect(usePolymarketPositions.getState().lostPositions).toEqual([lostPosition]);

    polymarketPositionsActions.remove(winningPosition);
    expect(usePolymarketPositions.getState().activePositions).toEqual([largerPosition, smallerPosition]);
    expect(usePolymarketPositions.getState().lostPositions).toEqual([lostPosition]);

    polymarketPositionsActions.remove(lostPosition);
    expect(usePolymarketPositions.getState().positions).toEqual([largerPosition, smallerPosition]);
    expect(usePolymarketPositions.getState().lostPositions).toHaveLength(0);
  });

  it.each([
    { soldSize: 20, buys: 1, interleavedReads: true },
    { soldSize: 5, buys: 1, interleavedReads: false },
    { soldSize: 5, buys: 2, interleavedReads: false },
  ])(
    'keeps $buys rebuys visible after selling $soldSize shares while the index catches up',
    async ({ soldSize, buys, interleavedReads }) => {
      const sold = createPosition({ size: soldSize, initialValue: soldSize * 0.4 });
      await refreshPositions(sold);
      polymarketPositionsActions.remove(sold);

      const snapshotsBeforeRebuy = interleavedReads ? [undefined, sold] : [];
      for (const snapshot of snapshotsBeforeRebuy) {
        await refreshPositions(snapshot);
        expect(polymarketPositionsActions.getPosition(sold.asset, mockProxyAddress)).toBeUndefined();
        expect(usePolymarketPositions.getState().activePositions).toHaveLength(0);
      }

      for (let i = 0; i < buys; i++) {
        applyBuy({
          event: createEvent(),
          market: sold.market,
          outcomeIndex: 0,
          proxyAddress: mockProxyAddress,
          positionAmounts: { tokens: '5', usd: '2' },
        });
      }

      const expected = { asset: sold.asset, proxyWallet: mockProxyAddress, size: 5 * buys, initialValue: 2 * buys };
      expect(usePolymarketPositions.getState().activePositions[0]).toMatchObject(expected);

      const snapshotsAfterRebuy = [createPosition(expected), undefined];
      if (interleavedReads) snapshotsAfterRebuy.unshift(sold);

      for (const snapshot of snapshotsAfterRebuy) {
        await refreshPositions(snapshot);
        expect(usePolymarketPositions.getState().activePositions[0]).toMatchObject(expected);
      }
    }
  );

  it('restores a failed sell without discarding a later accepted buy', async () => {
    const position = createPosition({ initialValue: 8, size: 20 });
    await refreshPositions(position);

    const sale = polymarketPositionsActions.remove(position);
    applyBuy({
      event: createEvent(),
      market: createMarket(),
      outcomeIndex: 0,
      positionAmounts: { tokens: '5', usd: '2' },
      proxyAddress: mockProxyAddress,
    });

    sale.discard();

    expect(usePolymarketPositionsStore.getState().getPosition(position.asset, mockProxyAddress)).toMatchObject({
      initialValue: 10,
      size: 25,
    });

    await refreshPositions(position);
    expect(usePolymarketPositionsStore.getState().getPosition(position.asset, mockProxyAddress)).toMatchObject({
      initialValue: 10,
      size: 25,
    });
  });
});

function applyBuy({
  proxyAddress,
  positionAmounts,
  ...details
}: PolymarketOrderDetails & {
  proxyAddress: Address;
  positionAmounts: PolymarketOrderAmounts;
}) {
  const update = polymarketPositionsActions.beginBuy({
    asset: details.market.clobTokenIds[details.outcomeIndex],
    proxyAddress,
  });
  update.publish(details, positionAmounts);
  return update;
}

function createMarketWithoutEvents(): PolymarketMarket {
  const market = createMarket();
  market.events = [];
  return market;
}

function buildPositionsCacheEntry(positions: PolymarketPosition[]) {
  return {
    cacheTime: TEST_CACHE_TIME,
    data: Object.fromEntries(positions.map(position => [position.asset, position])),
    errorInfo: null,
    lastFetchedAt: Date.now(),
  };
}

async function refreshPositions(position?: PolymarketPosition): Promise<void> {
  mockPositionsFetch(position);
  await polymarketPositionsActions.fetch({ proxyAddress: mockProxyAddress }, { force: true, throwOnError: true });
}

function mockPositionsFetch(position?: PolymarketPosition): void {
  if (!position) {
    fetch.mockResolvedValueOnce(Response.json({ data: [] }));
    return;
  }

  const holding: RawPolymarketPosition = {
    proxy_wallet: position.proxyWallet,
    token_id: position.asset,
    condition_id: position.conditionId,
    current_size: position.size,
    entry_cost_usdc: position.initialValue,
    current_value: position.currentValue,
    unrealized_pnl: position.cashPnl,
    current_price: position.curPrice,
    redeemable: position.redeemable,
    slug: position.slug,
    icon: position.icon,
    event_id: position.eventId,
    event_slug: position.eventSlug,
    outcome: position.outcome,
    outcome_index: position.outcomeIndex,
    negative_risk: position.negativeRisk,
  };
  const market = position.market;
  fetch.mockResolvedValueOnce(Response.json({ data: [holding] })).mockResolvedValueOnce(
    Response.json([
      {
        ...market,
        clobTokenIds: JSON.stringify(market.clobTokenIds),
        outcomes: JSON.stringify(market.outcomes),
        outcomePrices: JSON.stringify(market.outcomePrices),
      },
    ])
  );
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
}
