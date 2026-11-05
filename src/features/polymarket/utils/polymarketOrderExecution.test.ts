import { AssetType, Chain, OrderBuilder, OrderType, Side, SignatureTypeV2 } from '@polymarket/clob-client-v2';
import { ethers } from 'ethers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { analytics } from '@/analytics';
import { PolymarketBuyPositionError } from '@/features/polymarket/errors';
import { getPolymarketOrderClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { polymarketBalanceActions } from '@/features/polymarket/stores/polymarketBalanceStore';
import { usePolymarketOrderStore } from '@/features/polymarket/stores/polymarketOrderStore';
import { polymarketPositionsActions } from '@/features/polymarket/stores/polymarketPositionsStore';
import { createEvent, createMarket, createPosition } from '@/features/polymarket/test/fixtures';
import { type SuccessfulOrderResult } from '@/features/polymarket/types';
import { type RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getPolygonUsdcBalance, wrapUsdcToPusd } from '@/features/polymarket/utils/collateral';
import { collectPolymarketTradeFee } from '@/features/polymarket/utils/collectPolymarketTradeFee';
import { refetchPolymarketBalance, refetchPolymarketStores } from '@/features/polymarket/utils/refetchPolymarketStores';
import { fetchTeamsForEvent } from '@/features/polymarket/utils/sports';
import { ensureTradingApprovals } from '@/features/polymarket/utils/tradingApprovals';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';

import { executePolymarketBuyPosition, executePolymarketSellPosition } from './polymarketOrderExecution';

vi.mock('@/features/polymarket/constants', () => ({ POLYMARKET_GAMMA_API_URL: 'https://gamma.test' }));
vi.mock('@/framework/data/http/rainbowFetch', () => ({ rainbowFetch: vi.fn() }));
vi.mock('@/navigation/routesNames', () => ({ default: { POLYMARKET_NEW_POSITION_SHEET: 'new-position' } }));
vi.mock('@/state/navigation/navigationStore', () => ({
  useNavigationStore: { getSnapshot: () => ({ isRouteActive: () => true }), subscribe: () => () => undefined },
}));
vi.mock('@/features/polymarket/utils/sports', () => ({ fetchTeamsForEvent: vi.fn() }));
vi.mock('@/features/polymarket/utils/transforms', () => ({ processRawPolymarketEvent: vi.fn() }));
vi.mock('@/analytics', () => ({
  analytics: { event: { predictionsOrderMatchFailed: 'failed', predictionsPlaceOrder: 'placed' }, track: vi.fn() },
}));
vi.mock('@/features/polymarket/stores/derived/usePolymarketClients', () => ({ getPolymarketOrderClients: vi.fn() }));
vi.mock('@/features/polymarket/stores/polymarketBalanceStore', () => ({
  usePolymarketBalanceStore: { getState: () => ({ getBalance: () => '100' }) },
  polymarketBalanceActions: {
    beginUpdate: vi.fn(),
  },
}));
vi.mock('@/features/polymarket/stores/polymarketPositionsStore', () => ({
  polymarketPositionsActions: {
    beginBuy: vi.fn(),
    remove: vi.fn(),
  },
}));
vi.mock('@/features/polymarket/utils/collateral', () => ({ getPolygonUsdcBalance: vi.fn(), wrapUsdcToPusd: vi.fn() }));
vi.mock('@/features/polymarket/utils/collectPolymarketTradeFee', () => ({ collectPolymarketTradeFee: vi.fn() }));
vi.mock('@/features/polymarket/utils/refetchPolymarketStores', () => ({
  refetchPolymarketBalance: vi.fn(),
  refetchPolymarketStores: vi.fn(),
}));
vi.mock('@/features/polymarket/utils/tradingApprovals', () => ({ ensureTradingApprovals: vi.fn() }));
vi.mock('@/utils/delay', () => ({ delay: vi.fn(async () => undefined) }));

const wallet = { address: '0x0000000000000000000000000000000000000001' as const, execute: vi.fn() };
const client = { createAndPostMarketOrder: vi.fn(), getOrder: vi.fn(), getTrades: vi.fn(), updateBalanceAllowance: vi.fn() };
const balanceUpdate = { apply: vi.fn(), finalize: vi.fn(), discard: vi.fn() };
const positionUpdate = { publish: vi.fn(), amend: vi.fn(), discard: vi.fn() };
const positionRemoval = { discard: vi.fn() };
const matchedAnalytics = {
  eventSlug: 'event-slug',
  marketSlug: 'market-slug',
  outcome: 'Yes',
  tokenId: '101',
  orderAmountUsd: 5,
  feeAmountUsd: 0.12,
  tokenAmount: 10,
  spread: 0.01,
  bestPriceUsd: 0.49,
  orderPriceUsd: 0.5,
  averagePriceUsd: 0.5,
};

function buyParams() {
  return {
    event: createEvent(),
    market: createMarket(),
    outcomeIndex: 0,
    amount: '5',
    orderQuote: {
      expectedAmounts: { tokens: '10', usd: '5' },
      quotedTotalFeeUsd: '0.12',
      quotedRainbowFeeUsd: '0.1',
      spread: '0.01',
      bestPriceUsd: '0.49',
      orderPriceUsd: '0.5',
    },
  };
}

function orderResult(overrides: Partial<SuccessfulOrderResult> = {}): SuccessfulOrderResult {
  return {
    success: true,
    errorMsg: '',
    makingAmount: '5',
    takingAmount: '10',
    orderID: 'order',
    status: 'matched',
    transactionsHashes: ['0xsettlement'],
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('polymarketOrderExecution', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    usePolymarketOrderStore.setState({ queryCache: {} });
    vi.mocked(processRawPolymarketEvent, { partial: true }).mockResolvedValue({
      ...createEvent(),
      sortBy: undefined,
      markets: [createMarket()],
    });
    vi.mocked(fetchTeamsForEvent).mockResolvedValue(undefined);
    vi.mocked(getPolymarketOrderClients, { partial: true, deep: true }).mockResolvedValue({ clobClient: client, wallet });
    vi.mocked(getPolygonUsdcBalance).mockResolvedValue(ethers.constants.Zero);
    vi.mocked(collectPolymarketTradeFee).mockResolvedValue('0.1');
    vi.mocked(polymarketBalanceActions.beginUpdate).mockReturnValue(balanceUpdate);
    vi.mocked(polymarketPositionsActions.beginBuy).mockReturnValue(positionUpdate);
    vi.mocked(polymarketPositionsActions.remove).mockReturnValue(positionRemoval);
    client.createAndPostMarketOrder.mockResolvedValue(orderResult());
    client.getOrder.mockResolvedValue({ status: 'matched', size_matched: '10', price: '0.5', associate_trades: ['trade'] });
    client.getTrades.mockResolvedValue([{ id: 'trade', status: 'CONFIRMED', transaction_hash: '0xsettlement' }]);
  });

  it.each([
    ['v1', SignatureTypeV2.POLY_GNOSIS_SAFE, '2', '0xe111180000d2663c0091e4f400237545b87b996b'],
    ['v2', SignatureTypeV2.POLY_GNOSIS_SAFE, '3', '0xe3333700ca9d93003f00f0f71f8515005f6c00aa'],
    ['v2', SignatureTypeV2.POLY_1271, '3', '0xe3333700ca9d93003f00f0f71f8515005f6c00aa'],
  ] as const)(
    'signs %s market buys on the correct exchange for wallet type %i',
    async (version, signatureType, domainVersion, exchange) => {
      const signer = ethers.Wallet.createRandom();
      const maker = '0x0000000000000000000000000000000000000001';
      const sign = vi.spyOn(signer, '_signTypedData');
      const builder = new OrderBuilder(signer, Chain.POLYGON, signatureType, maker);
      client.createAndPostMarketOrder.mockImplementationOnce(async (order, options) => {
        await builder.buildMarketOrder(order, { ...options, tickSize: '0.01' }, options?.version);
        return orderResult();
      });
      const params = buyParams();
      const result = await executePolymarketBuyPosition({ ...params, market: { ...params.market, version } });
      await result.followUp;
      const [domain, , message] = sign.mock.calls[0];
      expect(domain.version).toBe(domainVersion);
      expect(domain.verifyingContract?.toLowerCase()).toBe(exchange);
      const order = { maker, tokenId: '101', signatureType };
      const expectedMessage =
        signatureType === SignatureTypeV2.POLY_1271
          ? { name: 'DepositWallet', verifyingContract: maker, contents: { ...order, signer: maker } }
          : { ...order, signer: signer.address };
      expect(message).toMatchObject(expectedMessage);
      expect(ensureTradingApprovals).toHaveBeenCalledWith(client, wallet, version, Side.BUY);
    }
  );

  it('loads Sports position presentation only after acceptance without delaying the accepted result', async () => {
    const post = deferred<SuccessfulOrderResult>();
    const teams = deferred<Awaited<ReturnType<typeof fetchTeamsForEvent>>>();
    client.createAndPostMarketOrder.mockReturnValue(post.promise);
    vi.mocked(fetchTeamsForEvent).mockReturnValue(teams.promise);
    const params = await sportsParams();
    expect(params.event.markets.map(market => market.id)).toEqual(['market-1']);
    expect(params.market).toMatchObject({ conditionId: 'condition-1', clobTokenIds: ['101', '102'], outcomes: ['Yes', 'No'] });
    expect(params.market).not.toHaveProperty('color');
    expect(params.outcomeIndex).toBe(0);
    expect(rainbowFetch).toHaveBeenCalledWith('https://gamma.test/events/event-1', expect.any(Object));

    const submission = executePolymarketBuyPosition(params);
    await vi.waitFor(() => expect(client.createAndPostMarketOrder).toHaveBeenCalled());
    expect(fetchTeamsForEvent).not.toHaveBeenCalled();
    expect(processRawPolymarketEvent).not.toHaveBeenCalled();
    expect(positionUpdate.publish).not.toHaveBeenCalled();
    expect(polymarketPositionsActions.beginBuy).toHaveBeenCalledWith({
      asset: '101',
      proxyAddress: wallet.address,
    });

    post.resolve(orderResult());
    const accepted = await submission;
    expect(accepted.success).toBe(true);
    expect(fetchTeamsForEvent).toHaveBeenCalledTimes(1);
    expect(positionUpdate.publish).not.toHaveBeenCalled();
    expect(balanceUpdate.apply).toHaveBeenCalled();

    teams.resolve(undefined);
    await accepted.followUp;
    expect(positionUpdate.publish).toHaveBeenCalledWith(expect.objectContaining({ market: expect.objectContaining({ id: 'market-1' }) }), {
      tokens: '10',
      usd: '5',
    });
    expect(positionUpdate.amend).not.toHaveBeenCalled();
    expect(collectPolymarketTradeFee).toHaveBeenCalledTimes(1);
  });

  it('continues financial follow-up and releases the pending position if presentation fails', async () => {
    vi.mocked(processRawPolymarketEvent).mockRejectedValue(new Error('presentation'));
    const accepted = await executePolymarketBuyPosition(await sportsParams());
    await accepted.followUp;
    expect(accepted.success).toBe(true);
    expect(positionUpdate.discard).toHaveBeenCalledOnce();
    expect(positionUpdate.publish).not.toHaveBeenCalled();
    expect(balanceUpdate.discard).not.toHaveBeenCalled();
    expect(collectPolymarketTradeFee).toHaveBeenCalledTimes(1);
    expect(balanceUpdate.finalize).toHaveBeenCalled();
  });

  it.each([
    { outcome: 'collected', collectedFee: '0.08', expectedFinalization: [['0.02']] },
    { outcome: 'unresolved', collectedFee: undefined, expectedFinalization: [] },
  ])('publishes an accepted buy before its fee is $outcome', async ({ collectedFee, expectedFinalization }) => {
    const fee = deferred<string | undefined>();
    vi.mocked(collectPolymarketTradeFee).mockReturnValue(fee.promise);
    const result = await executePolymarketBuyPosition(buyParams());
    expect(result.success).toBe(true);
    expect(fetchTeamsForEvent).not.toHaveBeenCalled();
    expect(processRawPolymarketEvent).not.toHaveBeenCalled();
    expect(client.updateBalanceAllowance).toHaveBeenCalledWith({ asset_type: AssetType.COLLATERAL });
    expect(client.createAndPostMarketOrder).toHaveBeenCalledWith(
      { side: Side.BUY, tokenID: '101', amount: 5, price: 0.5, userUSDCBalance: 5 },
      { version: 2, negRisk: false },
      OrderType.FOK
    );
    expect(positionUpdate.publish).toHaveBeenCalledWith(expect.objectContaining({ market: expect.objectContaining({ id: 'market-1' }) }), {
      tokens: '10',
      usd: '5',
    });
    expect(balanceUpdate.apply).toHaveBeenCalledWith('-5.12');
    expect(balanceUpdate.finalize).not.toHaveBeenCalled();
    expect(analytics.track).toHaveBeenCalledWith('placed', { ...matchedAnalytics, side: 'buy' });
    expect(collectPolymarketTradeFee).toHaveBeenCalledWith({
      wallet,
      orderId: 'order',
      quotedFeeUsd: '0.1',
      side: 'buy',
      tokenId: '101',
      matchedAmounts: { tokens: '10', usd: '5' },
      settlementTransactionHashes: ['0xsettlement'],
    });
    fee.resolve(collectedFee);
    await result.followUp;

    expect(refetchPolymarketStores).toHaveBeenCalledWith(wallet.address);
    expect(balanceUpdate.finalize.mock.calls).toEqual(expectedFinalization);
    expect(balanceUpdate.discard).not.toHaveBeenCalled();
  });

  it('registers the pending buy after collateral preparation and before posting', async () => {
    vi.mocked(getPolygonUsdcBalance).mockResolvedValue(ethers.utils.parseUnits('3', 6));
    vi.mocked(wrapUsdcToPusd).mockImplementation(async () => {
      expect(client.updateBalanceAllowance).not.toHaveBeenCalled();
      expect(client.createAndPostMarketOrder).not.toHaveBeenCalled();
      expect(polymarketPositionsActions.beginBuy).not.toHaveBeenCalled();
    });
    client.createAndPostMarketOrder.mockImplementation(async () => {
      expect(polymarketPositionsActions.beginBuy).toHaveBeenCalledWith({
        asset: '101',
        proxyAddress: wallet.address,
      });
      expect(polymarketBalanceActions.beginUpdate).toHaveBeenCalledWith(wallet.address);
      expect(balanceUpdate.apply).not.toHaveBeenCalled();
      return orderResult();
    });

    const result = await executePolymarketBuyPosition(buyParams());
    await result.followUp;
    expect(wrapUsdcToPusd).toHaveBeenCalledWith({ amount: ethers.utils.parseUnits('3', 6), wallet });
    expect(refetchPolymarketBalance).toHaveBeenCalledWith(wallet.address);
  });

  it('continues reconciliation when optimistic position publication fails', async () => {
    vi.mocked(positionUpdate.publish).mockImplementationOnce(() => {
      throw new Error('cache');
    });
    const result = await executePolymarketBuyPosition(buyParams());
    await result.followUp;
    expect(result.success).toBe(true);
    expect(balanceUpdate.finalize).toHaveBeenCalledWith('0');
  });

  it.each(['approval', 'balance read', 'conversion'] as const)('rejects before posting when %s fails', async phase => {
    const failure = new Error(phase);
    if (phase === 'approval') vi.mocked(ensureTradingApprovals).mockRejectedValueOnce(failure);
    else if (phase === 'balance read') vi.mocked(getPolygonUsdcBalance).mockRejectedValueOnce(failure);
    else {
      vi.mocked(getPolygonUsdcBalance).mockResolvedValueOnce(ethers.BigNumber.from(1));
      vi.mocked(wrapUsdcToPusd).mockRejectedValueOnce(failure);
    }
    const submission = executePolymarketBuyPosition(buyParams());
    await expect(submission).rejects.toBeInstanceOf(PolymarketBuyPositionError);
    await expect(submission).rejects.toMatchObject({
      reason: phase === 'approval' ? 'trading_approval_failed' : 'collateral_conversion_failed',
    });
    expect(getPolygonUsdcBalance).toHaveBeenCalledTimes(phase === 'approval' ? 0 : 1);
    expect(client.updateBalanceAllowance).not.toHaveBeenCalled();
    expect(client.createAndPostMarketOrder).not.toHaveBeenCalled();
    expect(positionUpdate.publish).not.toHaveBeenCalled();
  });

  it.each(['buy', 'sell'])('releases a rejected %s submission without publishing a position', async side => {
    client.createAndPostMarketOrder.mockResolvedValue({ error: 'rejected', status: 400 });
    const submission =
      side === 'buy'
        ? executePolymarketBuyPosition(await sportsParams())
        : executePolymarketSellPosition({ position: createPosition(), orderQuote: buyParams().orderQuote });

    await expect(submission).rejects.toThrow('rejected');
    expect(positionUpdate.publish).not.toHaveBeenCalled();
    expect(polymarketPositionsActions.remove).not.toHaveBeenCalled();
    expect(fetchTeamsForEvent).not.toHaveBeenCalled();
    expect(processRawPolymarketEvent).not.toHaveBeenCalled();
    expect(positionUpdate.discard).toHaveBeenCalledTimes(side === 'buy' ? 1 : 0);
    expect(balanceUpdate.discard).toHaveBeenCalledOnce();
  });

  it.each(['v1', 'v2'] as const)('removes an accepted %s sale and credits its estimated proceeds', async version => {
    const fee = deferred<string | undefined>();
    vi.mocked(collectPolymarketTradeFee).mockReturnValue(fee.promise);
    const position = createPosition({ proxyWallet: wallet.address, size: 10, negativeRisk: true, market: { ...createMarket(), version } });
    client.createAndPostMarketOrder.mockResolvedValue(orderResult({ makingAmount: '10', takingAmount: '5' }));
    const result = await executePolymarketSellPosition({ position, orderQuote: buyParams().orderQuote });
    expect(polymarketPositionsActions.remove).toHaveBeenCalledWith(position);
    expect(balanceUpdate.apply).toHaveBeenCalledWith('4.88');
    expect(balanceUpdate.finalize).not.toHaveBeenCalled();

    fee.resolve('0.1');
    await result.followUp;

    expect(client.createAndPostMarketOrder).toHaveBeenCalledWith(
      { side: Side.SELL, ...(version === 'v1' ? { tokenID: position.asset } : { positionID: position.asset }), amount: 10, price: 0.5 },
      version === 'v1' ? { version: 2, negRisk: true } : undefined,
      OrderType.FOK
    );
    expect(getPolymarketOrderClients).toHaveBeenCalledWith(wallet.address);
    expect(ensureTradingApprovals).toHaveBeenCalledWith(client, wallet, version, Side.SELL);
    expect(client.updateBalanceAllowance).toHaveBeenCalledWith({
      asset_type: version === 'v1' ? AssetType.CONDITIONAL : 'CONDITIONAL-V2',
      token_id: position.asset,
    });
    expect(analytics.track).toHaveBeenCalledWith('placed', { ...matchedAnalytics, side: 'sell' });
    expect(collectPolymarketTradeFee).toHaveBeenCalledWith({
      wallet,
      orderId: 'order',
      quotedFeeUsd: '0.1',
      side: 'sell',
      tokenId: position.asset,
      matchedAmounts: { tokens: '10', usd: '5' },
      settlementTransactionHashes: ['0xsettlement'],
    });
  });

  it('requests a sale from the holder of the position', async () => {
    const position = createPosition();
    vi.mocked(getPolymarketOrderClients).mockRejectedValueOnce(new Error('Trading wallet does not match the requested account'));
    await expect(executePolymarketSellPosition({ position, orderQuote: buyParams().orderQuote })).rejects.toThrow('does not match');
    expect(getPolymarketOrderClients).toHaveBeenCalledWith(position.proxyWallet);
    expect(client.createAndPostMarketOrder).not.toHaveBeenCalled();
  });

  it.each([
    { side: 'buy', adjustment: '1', amendments: [[{ tokens: '8', usd: '4' }]] },
    { side: 'sell', adjustment: '-1', amendments: [] },
  ])('reconciles a delayed lower $side fill on the original account after an account switch', async ({ side, adjustment, amendments }) => {
    client.createAndPostMarketOrder.mockResolvedValue(orderResult({ status: 'live', transactionsHashes: [] }));
    const matched = deferred<{ status: string; size_matched: string; price: string; associate_trades: string[] }>();
    client.getOrder.mockReturnValue(matched.promise);
    const result =
      side === 'buy'
        ? await executePolymarketBuyPosition(buyParams())
        : await executePolymarketSellPosition({
            position: createPosition({ proxyWallet: wallet.address, size: 10 }),
            orderQuote: buyParams().orderQuote,
          });

    vi.mocked(getPolymarketOrderClients).mockRejectedValue(new Error('different active account'));
    matched.resolve({ status: 'matched', size_matched: '8', price: '0.5', associate_trades: ['trade'] });
    await result.followUp;

    expect(getPolymarketOrderClients).toHaveBeenCalledTimes(1);
    expect(client.getOrder).toHaveBeenCalledWith('order');
    expect(positionUpdate.amend.mock.calls).toEqual(amendments);
    expect(collectPolymarketTradeFee).toHaveBeenCalledWith(
      expect.objectContaining({ wallet, settlementTransactionHashes: ['0xsettlement'] })
    );
    expect(balanceUpdate.finalize).toHaveBeenCalledWith(adjustment);
  });

  it.each(['rejected', 'canceled', 'expired', 'failed'])('rolls back an accepted order when polling reports %s', async status => {
    client.createAndPostMarketOrder.mockResolvedValue(orderResult({ status: 'live', transactionsHashes: [] }));
    client.getOrder.mockResolvedValue({ status });
    const result = await executePolymarketBuyPosition(buyParams());
    await result.followUp;
    expect(positionUpdate.discard).toHaveBeenCalledOnce();
    expect(balanceUpdate.discard).toHaveBeenCalledOnce();
    expect(collectPolymarketTradeFee).not.toHaveBeenCalled();
    expect(analytics.track).toHaveBeenCalledWith('failed', {
      orderId: 'order',
      eventSlug: 'event-slug',
      marketSlug: 'market-slug',
      outcome: 'Yes',
      tokenId: '101',
      side: 'buy',
      status,
      reason: status,
    });
  });

  it('waits for missing trade settlement hashes before collecting a fee', async () => {
    client.createAndPostMarketOrder.mockResolvedValue(orderResult({ transactionsHashes: [] }));
    client.getOrder.mockResolvedValue({ status: 'matched', size_matched: '10', price: '0.55', associate_trades: ['trade'] });
    const trades = deferred<{ id: string; status: string; transaction_hash: string }[]>();
    client.getTrades.mockResolvedValueOnce([{ id: 'trade', status: 'MATCHED', transaction_hash: '' }]).mockReturnValueOnce(trades.promise);
    const result = await executePolymarketBuyPosition(buyParams());
    await vi.waitFor(() => expect(client.getTrades).toHaveBeenCalledTimes(2));
    expect(client.getTrades).toHaveBeenCalledWith({ id: 'trade' }, true);
    expect(collectPolymarketTradeFee).not.toHaveBeenCalled();
    trades.resolve([{ id: 'trade', status: 'CONFIRMED', transaction_hash: '0xsettlement' }]);
    await result.followUp;
    expect(collectPolymarketTradeFee).toHaveBeenCalledWith(
      expect.objectContaining({ matchedAmounts: { tokens: '10', usd: '5' }, settlementTransactionHashes: ['0xsettlement'] })
    );
  });

  it('rolls back a failed associated trade without collecting fees', async () => {
    client.createAndPostMarketOrder.mockResolvedValue(orderResult({ transactionsHashes: [] }));
    client.getTrades.mockResolvedValue([{ id: 'trade', status: 'FAILED', transaction_hash: '' }]);
    const result = await executePolymarketBuyPosition(buyParams());
    await result.followUp;
    expect(collectPolymarketTradeFee).not.toHaveBeenCalled();
    expect(positionUpdate.discard).toHaveBeenCalled();
    expect(analytics.track).toHaveBeenCalledWith(
      'failed',
      expect.objectContaining({ orderId: 'order', reason: 'failed', status: 'failed' })
    );
  });

  it('leaves an unresolved order provisional when polling fails', async () => {
    client.createAndPostMarketOrder.mockResolvedValue(orderResult({ status: 'live', transactionsHashes: [] }));
    client.getOrder.mockRejectedValue(new Error('network'));
    const result = await executePolymarketBuyPosition(buyParams());
    await result.followUp;
    expect(balanceUpdate.discard).not.toHaveBeenCalled();
    expect(balanceUpdate.finalize).not.toHaveBeenCalled();
  });
});

async function sportsParams() {
  const params = buyParams();
  const rawMarket: RawPolymarketMarket = {
    ...params.market,
    clobTokenIds: JSON.stringify(params.market.clobTokenIds),
    outcomes: JSON.stringify(params.market.outcomes),
    outcomePrices: JSON.stringify(params.market.outcomePrices),
  };
  delete rawMarket.events;
  vi.mocked(rainbowFetch).mockResolvedValue({
    data: { ...params.event, gameId: 1, markets: [{ ...rawMarket, id: 'unrelated' }, rawMarket] },
    status: 200,
    headers: new Headers(),
  });

  const details = await usePolymarketOrderStore
    .getState()
    .fetch(
      { outcome: { eventId: params.event.id, marketId: params.market.id, tokenId: params.market.clobTokenIds[0], outcomeIndex: 0 } },
      { force: true }
    );
  if (!details) throw new Error('Expected Sports order details');

  return { ...params, ...details };
}
