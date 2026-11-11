import { setImmediate } from 'node:timers/promises';

import { AssetType, Chain, OrderBuilder, OrderType, Side, SignatureTypeV2 } from '@polymarket/clob-client-v2';
import { ethers } from 'ethers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { analytics } from '@/analytics';
import { PolymarketBuyPositionError, PolymarketTransactionFailedError } from '@/features/polymarket/errors';
import { getPolymarketOrderClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { polymarketBalanceActions } from '@/features/polymarket/stores/polymarketBalanceStore';
import { usePolymarketOrderStore } from '@/features/polymarket/stores/polymarketOrderStore';
import { polymarketPositionsActions } from '@/features/polymarket/stores/polymarketPositionsStore';
import { createEvent, createMarket, createPosition } from '@/features/polymarket/test/fixtures';
import { type SuccessfulOrderResult } from '@/features/polymarket/types';
import { type RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getPolygonUsdcBalance, wrapUsdcToPusd } from '@/features/polymarket/utils/collateral';
import { collectPolymarketTradeFee } from '@/features/polymarket/utils/collectPolymarketTradeFee';
import { awaitPolygonConfirmation } from '@/features/polymarket/utils/confirmation';
import { refetchPolymarketBalance, refetchPolymarketStores } from '@/features/polymarket/utils/refetchPolymarketStores';
import { fetchTeamsForEvent } from '@/features/polymarket/utils/sports';
import { ensureTradingApprovals } from '@/features/polymarket/utils/tradingApprovals';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { delay } from '@/utils/delay';

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
vi.mock('@/features/polymarket/utils/confirmation', () => ({ awaitPolygonConfirmation: vi.fn() }));
vi.mock('@/features/polymarket/utils/refetchPolymarketStores', () => ({
  refetchPolymarketBalance: vi.fn(),
  refetchPolymarketStores: vi.fn(),
}));
vi.mock('@/features/polymarket/utils/tradingApprovals', () => ({ ensureTradingApprovals: vi.fn() }));

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
    orderSpendCap: '5',
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
    vi.mocked(awaitPolygonConfirmation).mockResolvedValue(undefined);
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
    const post = Promise.withResolvers<SuccessfulOrderResult>();
    const teams = Promise.withResolvers<Awaited<ReturnType<typeof fetchTeamsForEvent>>>();
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
    const fee = Promise.withResolvers<string | undefined>();
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
    await vi.waitFor(() => expect(collectPolymarketTradeFee).toHaveBeenCalled());
    expect(analytics.track).toHaveBeenCalledWith('placed', { ...matchedAnalytics, side: 'buy' });
    expect(collectPolymarketTradeFee).toHaveBeenCalledWith({
      wallet,
      orderId: 'order',
      quotedFeeUsd: '0.1',
      side: 'buy',
      tokenId: '101',
      matchedAmounts: { tokens: '10', usd: '5' },
    });
    fee.resolve(collectedFee);
    await result.followUp;

    expect(refetchPolymarketStores).toHaveBeenCalledWith(wallet.address);
    expect(balanceUpdate.finalize.mock.calls).toEqual(expectedFinalization);
    expect(balanceUpdate.discard).not.toHaveBeenCalled();
  });

  it.each(['0', '0.1'])('publishes acceptance but waits for all receipts before collecting a $%s fee', async quotedRainbowFeeUsd => {
    const confirmation = Promise.withResolvers<void>();
    const params = buyParams();
    params.orderQuote.quotedRainbowFeeUsd = quotedRainbowFeeUsd;
    vi.mocked(collectPolymarketTradeFee).mockResolvedValue(quotedRainbowFeeUsd);
    client.createAndPostMarketOrder.mockResolvedValue(orderResult({ transactionsHashes: ['0xfirst', '0xsecond'] }));
    vi.mocked(awaitPolygonConfirmation).mockResolvedValueOnce(undefined).mockReturnValueOnce(confirmation.promise);

    const result = await executePolymarketBuyPosition(params);
    await setImmediate();

    expect(positionUpdate.publish).toHaveBeenCalled();
    expect(balanceUpdate.apply).toHaveBeenCalled();
    expect(collectPolymarketTradeFee).not.toHaveBeenCalled();
    expect(balanceUpdate.finalize).not.toHaveBeenCalled();

    confirmation.resolve();
    await result.followUp;

    expect(vi.mocked(awaitPolygonConfirmation).mock.calls).toEqual([['0xfirst'], ['0xsecond']]);
    expect(collectPolymarketTradeFee).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ quotedFeeUsd: quotedRainbowFeeUsd }));
    expect(client.getOrder).not.toHaveBeenCalled();
    expect(balanceUpdate.finalize).toHaveBeenCalled();
  });

  it.each([
    { source: 'accepted', hashes: ['0xreverted'] },
    { source: 'polled', hashes: [] },
  ])('follows a replacement settlement after the $source hash reverts', async ({ hashes }) => {
    const confirmation = Promise.withResolvers<void>();
    client.createAndPostMarketOrder.mockResolvedValue(orderResult({ transactionsHashes: hashes }));
    if (!hashes.length) client.getTrades.mockResolvedValueOnce([{ id: 'trade', status: 'MINED', transaction_hash: '0xreverted' }]);
    client.getTrades
      .mockResolvedValueOnce([{ id: 'trade', status: 'RETRYING', transaction_hash: '0xreverted' }])
      .mockResolvedValue([{ id: 'trade', status: 'MINED', transaction_hash: '0xreplacement' }]);
    vi.mocked(awaitPolygonConfirmation).mockRejectedValueOnce(new PolymarketTransactionFailedError('reverted'));
    vi.mocked(awaitPolygonConfirmation).mockReturnValueOnce(confirmation.promise);

    const result = await executePolymarketBuyPosition(buyParams());
    await vi.waitFor(() => expect(awaitPolygonConfirmation).toHaveBeenCalledWith('0xreplacement'), { timeout: 3000 });

    expect(collectPolymarketTradeFee).not.toHaveBeenCalled();
    expect(positionUpdate.discard).not.toHaveBeenCalled();
    expect(balanceUpdate.discard).not.toHaveBeenCalled();

    confirmation.resolve();
    await result.followUp;

    expect(vi.mocked(awaitPolygonConfirmation).mock.calls).toEqual([['0xreverted'], ['0xreplacement']]);
    expect(collectPolymarketTradeFee).toHaveBeenCalledOnce();
    expect(balanceUpdate.finalize).toHaveBeenCalled();
  });

  it.each(['buy', 'sell'])('rolls back a reverted %s only when its trade fails permanently', async side => {
    vi.mocked(awaitPolygonConfirmation).mockRejectedValueOnce(new PolymarketTransactionFailedError('reverted'));
    client.getTrades.mockResolvedValue([{ id: 'trade', status: 'FAILED', transaction_hash: '0xsettlement' }]);
    if (side === 'sell') client.createAndPostMarketOrder.mockResolvedValue(orderResult({ makingAmount: '10', takingAmount: '5' }));

    const result =
      side === 'buy'
        ? await executePolymarketBuyPosition(buyParams())
        : await executePolymarketSellPosition({ position: createPosition(), orderQuote: buyParams().orderQuote });
    await result.followUp;

    const discardPosition = side === 'buy' ? positionUpdate.discard : positionRemoval.discard;
    expect(discardPosition).toHaveBeenCalledOnce();
    expect(balanceUpdate.discard).toHaveBeenCalledOnce();
    expect(balanceUpdate.finalize).not.toHaveBeenCalled();
    expect(collectPolymarketTradeFee).not.toHaveBeenCalled();
    expect(refetchPolymarketStores).toHaveBeenLastCalledWith(wallet.address);
  });

  it('keeps acceptance provisional when receipt confirmation times out', async () => {
    vi.mocked(awaitPolygonConfirmation).mockRejectedValueOnce(new Error('timeout'));

    const result = await executePolymarketBuyPosition(buyParams());
    await result.followUp;

    expect(positionUpdate.discard).not.toHaveBeenCalled();
    expect(balanceUpdate.discard).not.toHaveBeenCalled();
    expect(balanceUpdate.finalize).not.toHaveBeenCalled();
    expect(collectPolymarketTradeFee).not.toHaveBeenCalled();
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
    const fee = Promise.withResolvers<string | undefined>();
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
    { side: 'buy', order: { status: 'MATCHED', associate_trades: ['trade'] } },
    { side: 'sell', order: null },
  ])('keeps a delayed $side pending until its own fill is available', async ({ side, order }) => {
    client.createAndPostMarketOrder.mockResolvedValue(
      orderResult({ status: 'delayed', takingAmount: '', makingAmount: '', transactionsHashes: [] })
    );
    client.getOrder.mockResolvedValue(order);
    const fill = {
      id: 'trade',
      taker_order_id: 'order',
      asset_id: '101',
      size: '6.72',
      price: '0.6',
      maker_orders: [{ asset_id: '102', matched_amount: '6.72', price: '0.4' }],
      status: 'MATCHED',
      transaction_hash: side === 'sell' ? '0xsettlement' : undefined,
    };
    const poll = Promise.withResolvers<(typeof fill)[]>();
    client.getTrades
      .mockResolvedValueOnce([{ ...fill, id: 'another-trade', taker_order_id: 'another-order' }])
      .mockReturnValueOnce(poll.promise);
    const receipt = Promise.withResolvers<void>();
    vi.mocked(awaitPolygonConfirmation).mockReturnValue(receipt.promise);

    const submission =
      side === 'buy'
        ? executePolymarketBuyPosition(buyParams())
        : executePolymarketSellPosition({ position: createPosition(), orderQuote: buyParams().orderQuote });
    const completed = vi.fn();
    void submission.then(completed);
    await vi.waitFor(() => expect(client.getTrades).toHaveBeenCalledTimes(2), { timeout: 3000 });
    expect(completed).not.toHaveBeenCalled();
    expect(balanceUpdate.apply).not.toHaveBeenCalled();
    expect(positionUpdate.publish).not.toHaveBeenCalled();
    expect(polymarketPositionsActions.remove).not.toHaveBeenCalled();

    poll.resolve([fill]);
    const { followUp } = await submission;
    expect(balanceUpdate.apply).toHaveBeenCalledWith(side === 'buy' ? '-4.152' : '3.912');
    expect(collectPolymarketTradeFee).not.toHaveBeenCalled();
    receipt.resolve();
    await followUp;
    expect(client.getTrades).toHaveBeenCalledTimes(side === 'sell' ? 2 : 3);
    expect(awaitPolygonConfirmation).toHaveBeenCalledExactlyOnceWith('0xsettlement');
    expect(collectPolymarketTradeFee).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ matchedAmounts: { tokens: '6.72', usd: '4.032' } })
    );
  });

  it.each([
    { price: '0.73', tick: 0.01, buyLimit: 0.74, sellLimit: 0.72 },
    { price: '0.30', tick: 0.1, buyLimit: 0.31, sellLimit: 0.29 },
    { price: '0.99', tick: 0.01, buyLimit: 0.99, sellLimit: 0.98 },
    { price: '0.01', tick: 0.01, buyLimit: 0.02, sellLimit: 0.01 },
  ])('applies the cent allowance before SDK rounding at $price with tick $tick', async ({ price, tick, buyLimit, sellLimit }) => {
    const params = buyParams();
    const market = { ...params.market, secondsDelay: 1, orderPriceMinTickSize: tick };
    const orderQuote = { ...params.orderQuote, orderPriceUsd: price };
    const buy = await executePolymarketBuyPosition({ ...params, market, orderSpendCap: '5.07', orderQuote });
    await buy.followUp;
    expect(client.createAndPostMarketOrder).toHaveBeenLastCalledWith(
      expect.objectContaining({ amount: 5, price: buyLimit, userUSDCBalance: 5.07 }),
      expect.anything(),
      OrderType.FOK
    );

    const sell = await executePolymarketSellPosition({ position: createPosition({ market }), orderQuote });
    await sell.followUp;
    expect(client.createAndPostMarketOrder).toHaveBeenLastCalledWith(
      expect.objectContaining({ price: sellLimit }),
      expect.anything(),
      OrderType.FOK
    );
  });

  describe('delayed order observation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      client.createAndPostMarketOrder.mockResolvedValue(orderResult({ status: 'delayed' }));
      client.getOrder.mockResolvedValue(null);
      client.getTrades.mockResolvedValue([]);
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('returns unconfirmed, then reconciles a late sale exactly once', async () => {
      const position = createPosition({ market: { ...createMarket(), secondsDelay: 1 } });
      const submission = executePolymarketSellPosition({ position, orderQuote: buyParams().orderQuote });
      await vi.advanceTimersByTimeAsync(999);
      expect(client.getOrder).not.toHaveBeenCalled();
      expect(client.getTrades).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(2001);
      const accepted = await submission;
      expect(accepted.status).toBe('delayed');
      expect(polymarketPositionsActions.remove).not.toHaveBeenCalled();

      client.getTrades.mockResolvedValue([
        { id: 'trade', taker_order_id: 'order', size: '6.49', price: '0.72', status: 'MATCHED', transaction_hash: '0xsettlement' },
      ]);
      await vi.advanceTimersByTimeAsync(4000);
      await accepted.followUp;
      expect(client.createAndPostMarketOrder).toHaveBeenCalledOnce();
      expect(polymarketPositionsActions.remove).toHaveBeenCalledOnce();
      expect(collectPolymarketTradeFee).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ matchedAmounts: { tokens: '6.49', usd: '4.6728' } })
      );
    });

    it.each(['unfilled', 'getOrder', 'getTrades'] as const)('ends observation and releases pending updates: %s', async outcome => {
      const read = Promise.withResolvers<null>();
      if (outcome !== 'unfilled') client[outcome].mockReturnValue(read.promise);
      if (outcome === 'getTrades') {
        client.getOrder.mockImplementation(async () => {
          await delay(100000);
          return null;
        });
      }
      const params = buyParams();
      const submission = executePolymarketBuyPosition({ ...params, market: { ...params.market, secondsDelay: 1 } });

      await vi.advanceTimersByTimeAsync(3000);
      const accepted = await submission;
      expect(accepted.status).toBe('delayed');
      const completed = vi.fn();
      void accepted.followUp.then(completed);
      await vi.advanceTimersByTimeAsync(118000);
      expect(completed).toHaveBeenCalledOnce();
      expect(positionUpdate.discard).toHaveBeenCalledOnce();
      expect(balanceUpdate.discard).toHaveBeenCalledOnce();

      const orderReads = client.getOrder.mock.calls.length;
      const tradeReads = client.getTrades.mock.calls.length;
      read.resolve(null);
      await vi.advanceTimersByTimeAsync(10000);
      expect(client.getOrder).toHaveBeenCalledTimes(orderReads);
      expect(client.getTrades).toHaveBeenCalledTimes(tradeReads);
      expect(positionUpdate.publish).not.toHaveBeenCalled();
      expect(collectPolymarketTradeFee).not.toHaveBeenCalled();
    });
  });

  it('discards a delayed buy when Polymarket cancels it', async () => {
    client.createAndPostMarketOrder.mockResolvedValue(orderResult({ status: 'delayed' }));
    client.getOrder.mockResolvedValue({ status: 'CANCELED' });
    await expect(executePolymarketBuyPosition(buyParams())).rejects.toThrow('canceled');
    expect(positionUpdate.discard).toHaveBeenCalledOnce();
    expect(balanceUpdate.discard).toHaveBeenCalledOnce();
    expect(balanceUpdate.apply).not.toHaveBeenCalled();
    expect(collectPolymarketTradeFee).not.toHaveBeenCalled();
  });

  it.each([
    { side: 'buy', adjustment: '1', amendments: [[{ tokens: '8', usd: '4' }]] },
    { side: 'sell', adjustment: '-1', amendments: [] },
  ])('reconciles a delayed lower $side fill on the original account after an account switch', async ({ side, adjustment, amendments }) => {
    client.createAndPostMarketOrder.mockResolvedValue(orderResult({ status: 'live', transactionsHashes: [] }));
    const matched = Promise.withResolvers<{ status: string; size_matched: string; price: string; associate_trades: string[] }>();
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
    expect(collectPolymarketTradeFee).toHaveBeenCalledWith(expect.objectContaining({ wallet }));
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
    const trades = Promise.withResolvers<{ id: string; status: string; transaction_hash: string }[]>();
    client.getTrades.mockResolvedValueOnce([{ id: 'trade', status: 'MATCHED', transaction_hash: '' }]).mockReturnValueOnce(trades.promise);
    const result = await executePolymarketBuyPosition(buyParams());
    await vi.waitFor(() => expect(client.getTrades).toHaveBeenCalledTimes(2), { timeout: 3000 });
    expect(client.getTrades).toHaveBeenCalledWith({ id: 'trade' }, true);
    expect(collectPolymarketTradeFee).not.toHaveBeenCalled();
    trades.resolve([{ id: 'trade', status: 'CONFIRMED', transaction_hash: '0xsettlement' }]);
    await result.followUp;
    expect(collectPolymarketTradeFee).toHaveBeenCalledWith(expect.objectContaining({ matchedAmounts: { tokens: '10', usd: '5' } }));
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
