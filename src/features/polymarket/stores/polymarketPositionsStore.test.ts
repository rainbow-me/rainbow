import { afterEach, expect, it, vi } from 'vitest';

import '../../../../config/test/storeEnvironment';

import { predictionEvent } from '../../../../config/test/predictionEvent';
import { polymarketPositionsActions } from './polymarketPositionsStore';

vi.mock('@/features/polymarket/stores/derived/usePolymarketClients', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { usePolymarketClients: createBaseStore(() => ({ proxyAddress: null })) };
});

afterEach(() => vi.restoreAllMocks());

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
  const fetch = vi
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce(Response.json({ data: [holding] }))
    .mockResolvedValueOnce(Response.json([market]));

  const result = await polymarketPositionsActions.fetch({ address }, { force: true, throwOnError: true });

  const url = new URL(String(fetch.mock.calls[0][0]));
  expect(url.origin + url.pathname).toBe('https://data-api.polymarket.com/v2/positions');
  expect(Object.fromEntries(url.searchParams)).toMatchObject({ user: address, filter_amount: '1' });

  for (const key of ['sort_by', 'sortBy']) {
    expect(url.searchParams.get(key) ?? 'CURRENT_VALUE').toBe('CURRENT_VALUE');
  }

  expect(result?.positions).toMatchObject([
    {
      proxyWallet: address,
      asset: '101',
      size: 11.7727,
      currentValue: 4.7091,
      initialValue: 5.1799,
      cashPnl: -0.4708,
    },
  ]);
});
