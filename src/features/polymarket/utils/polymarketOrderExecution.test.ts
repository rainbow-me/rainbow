import { AssetType, Chain, OrderBuilder, OrderType, Side, SignatureTypeV2 } from '@polymarket/clob-client-v2';
import { ethers } from 'ethers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import '../../../../config/test/storeEnvironment';

import { analytics } from '@/analytics';
import { PolymarketBuyPositionError } from '@/features/polymarket/errors';
import { getPolymarketOrderClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { createEvent, createMarket, createPosition } from '@/features/polymarket/test/fixtures';
import { type SuccessfulOrderResult } from '@/features/polymarket/types';
import { getPolygonUsdcBalance, wrapUsdcToPusd } from '@/features/polymarket/utils/collateral';
import { collectPolymarketTradeFee } from '@/features/polymarket/utils/collectPolymarketTradeFee';
import { ensureTradingApprovals } from '@/features/polymarket/utils/tradingApprovals';

import { executePolymarketBuyPosition, executePolymarketSellPosition } from './polymarketOrderExecution';

const mockCreateAndPostMarketOrder = vi.fn();
const mockGetOrder = vi.fn();
const mockGetTrades = vi.fn();
const mockUpdateBalanceAllowance = vi.fn();

vi.mock('@/analytics', () => ({
  analytics: {
    event: {
      predictionsOrderMatchFailed: 'predictions.order_match.failed',
      predictionsPlaceOrder: 'predictions.place_order',
    },
    track: vi.fn(),
  },
}));

const walletForOrder = { address: '0x0000000000000000000000000000000000000001', execute: vi.fn() } as const;
const client = {
  createAndPostMarketOrder: mockCreateAndPostMarketOrder,
  getOrder: mockGetOrder,
  getTrades: mockGetTrades,
  updateBalanceAllowance: mockUpdateBalanceAllowance,
};

vi.mock('@/features/polymarket/stores/derived/usePolymarketClients', () => ({
  getPolymarketOrderClients: vi.fn(async () => ({ clobClient: client, wallet: walletForOrder })),
}));

vi.mock('@/features/polymarket/utils/refetchPolymarketStores', () => ({
  refetchPolymarketBalance: vi.fn(),
  refetchPolymarketStores: vi.fn(),
}));

vi.mock('@/features/polymarket/stores/polymarketBalanceStore', () => ({
  polymarketBalanceActions: { getBalanceSnapshot: vi.fn(), applyExpectedBalanceDelta: vi.fn(), discardExpectedBalanceDelta: vi.fn() },
  usePolymarketBalanceStore: {
    getState: vi.fn(() => ({ getBalance: () => '100' })),
  },
}));

vi.mock('@/features/polymarket/stores/polymarketPositionsStore', () => ({
  polymarketPositionsActions: {
    beginExpectedBuyPosition: vi.fn(),
    applyExpectedBuyPosition: vi.fn(),
    amendExpectedBuyPosition: vi.fn(),
    applyExpectedPositionRemoval: vi.fn(),
    discardExpectedPosition: vi.fn(),
  },
}));
vi.mock('@/features/polymarket/utils/collateral', () => ({
  getPolygonUsdcBalance: vi.fn(async () => ({ isZero: () => true })),
  wrapUsdcToPusd: vi.fn(),
}));

vi.mock('@/features/polymarket/utils/collectPolymarketTradeFee', () => ({
  collectPolymarketTradeFee: vi.fn(),
}));

vi.mock('@/features/polymarket/utils/tradingApprovals', () => ({
  ensureTradingApprovals: vi.fn(),
}));

vi.mock('@/utils/delay', () => ({
  delay: vi.fn(async () => undefined),
}));

const mockAnalyticsTrack = vi.mocked(analytics.track);
const mockCollectPolymarketTradeFee = vi.mocked(collectPolymarketTradeFee);
const mockEnsureTradingApprovals = vi.mocked(ensureTradingApprovals);
const mockGetPolygonUsdcBalance = vi.mocked(getPolygonUsdcBalance);
const mockWrapUsdcToPusd = vi.mocked(wrapUsdcToPusd);

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

describe('executePolymarketOrder', () => {
  beforeEach(() => {
    vi.mocked(getPolymarketOrderClients).mockReset();
    mockAnalyticsTrack.mockReset();
    mockCollectPolymarketTradeFee.mockReset();
    mockCreateAndPostMarketOrder.mockReset();
    mockEnsureTradingApprovals.mockReset();
    mockGetPolygonUsdcBalance.mockReset();
    mockGetOrder.mockReset();
    mockGetTrades.mockReset();
    mockUpdateBalanceAllowance.mockReset();
    mockWrapUsdcToPusd.mockReset();

    mockGetPolygonUsdcBalance.mockResolvedValue(ethers.constants.Zero);
  });

  it.each([
    ['v1', SignatureTypeV2.POLY_GNOSIS_SAFE, '2', '0xe111180000d2663c0091e4f400237545b87b996b'],
    ['v2', SignatureTypeV2.POLY_GNOSIS_SAFE, '3', '0xe3333700ca9d93003f00f0f71f8515005f6c00aa'],
    ['v2', SignatureTypeV2.POLY_1271, '3', '0xe3333700ca9d93003f00f0f71f8515005f6c00aa'],
  ] as const)(
    'signs %s market buys on the correct exchange for wallet type %i',
    async (version, signatureType, domainVersion, exchange) => {
      const wallet = ethers.Wallet.createRandom();
      const maker = '0x0000000000000000000000000000000000000001';
      const sign = vi.spyOn(wallet, '_signTypedData');
      const builder = new OrderBuilder(wallet, Chain.POLYGON, signatureType, maker);
      mockCreateAndPostMarketOrder.mockImplementationOnce(async (order, options) => {
        await builder.buildMarketOrder(order, { ...options, tickSize: '0.01' }, options?.version);
        return createOrderResult({ orderID: 'offline-order', status: 'matched', transactionsHashes: ['0xsettlement'] });
      });
      const params = buyParams();
      await executePolymarketBuyPosition({ ...params, market: { ...params.market, version } });
      const [domain, , message] = sign.mock.calls[0];
      expect(domain.version).toBe(domainVersion);
      expect(domain.verifyingContract?.toLowerCase()).toBe(exchange);
      const order = { maker, tokenId: '101', signatureType };
      const expectedMessage =
        signatureType === SignatureTypeV2.POLY_1271
          ? { name: 'DepositWallet', verifyingContract: maker, contents: { ...order, signer: maker } }
          : { ...order, signer: wallet.address };
      expect(message).toMatchObject(expectedMessage);
      expect(mockEnsureTradingApprovals).toHaveBeenCalledWith(client, walletForOrder, version, Side.BUY);
    }
  );

  it('executes a buy order and starts trade fee collection for an immediate match', async () => {
    mockCreateAndPostMarketOrder.mockResolvedValue(
      createOrderResult({
        makingAmount: '5',
        orderID: 'buy-order',
        status: 'matched',
        takingAmount: '10',
        transactionsHashes: ['0xsettlement'],
      })
    );

    await executePolymarketBuyPosition(buyParams());

    expect(mockUpdateBalanceAllowance).toHaveBeenCalledWith({ asset_type: AssetType.COLLATERAL });
    expect(mockCreateAndPostMarketOrder).toHaveBeenCalledWith(
      {
        side: Side.BUY,
        tokenID: '101',
        amount: 5,
        price: 0.5,
        userUSDCBalance: 5,
      },
      { version: 2, negRisk: false },
      OrderType.FOK
    );
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('predictions.place_order', {
      eventSlug: 'event-slug',
      marketSlug: 'market-slug',
      outcome: 'Yes',
      orderAmountUsd: 5,
      feeAmountUsd: 0.12,
      tokenAmount: 10,
      tokenId: '101',
      side: 'buy',
      spread: 0.01,
      bestPriceUsd: 0.49,
      orderPriceUsd: 0.5,
      averagePriceUsd: 0.5,
    });
    expect(mockCollectPolymarketTradeFee).toHaveBeenCalledWith({
      wallet: walletForOrder,
      matchedAmounts: { tokens: '10', usd: '5' },
      orderId: 'buy-order',
      quotedFeeUsd: '0.1',
      settlementTransactionHashes: ['0xsettlement'],
      side: 'buy',
      tokenId: '101',
    });
  });

  it('collects on the accepted fill after its settlement hash becomes available', async () => {
    const trades = Promise.withResolvers<{ id: string; status: string; transaction_hash: string }[]>();
    mockCreateAndPostMarketOrder.mockResolvedValue(
      createOrderResult({
        makingAmount: '5',
        orderID: 'buy-order',
        status: 'matched',
        takingAmount: '10',
      })
    );
    mockGetOrder.mockResolvedValue({
      associate_trades: ['trade-1'],
      price: '0.55',
      size_matched: '10',
      status: 'matched',
    });
    mockGetTrades.mockReturnValueOnce(trades.promise);

    await executePolymarketBuyPosition(buyParams());
    await flushPromises();

    expect(mockGetTrades).toHaveBeenCalledWith({ id: 'trade-1' }, true);
    expect(mockCollectPolymarketTradeFee).not.toHaveBeenCalled();

    trades.resolve([{ id: 'trade-1', status: 'confirmed', transaction_hash: '0xsettlement' }]);
    await flushPromises();

    expect(mockCollectPolymarketTradeFee).toHaveBeenCalledWith(
      expect.objectContaining({ matchedAmounts: { tokens: '10', usd: '5' }, settlementTransactionHashes: ['0xsettlement'] })
    );
  });

  it('wraps existing Polygon USDC before placing a buy order', async () => {
    const usdcBalance = ethers.utils.parseUnits('3', 6);
    mockGetPolygonUsdcBalance.mockResolvedValueOnce(usdcBalance);
    mockWrapUsdcToPusd.mockImplementationOnce(async () => {
      expect(mockUpdateBalanceAllowance).not.toHaveBeenCalled();
      expect(mockCreateAndPostMarketOrder).not.toHaveBeenCalled();
    });
    mockCreateAndPostMarketOrder.mockResolvedValue(
      createOrderResult({
        makingAmount: '5',
        orderID: 'buy-order',
        status: 'matched',
        takingAmount: '10',
        transactionsHashes: ['0xsettlement'],
      })
    );

    await executePolymarketBuyPosition(buyParams());

    expect(mockWrapUsdcToPusd).toHaveBeenCalledWith({
      wallet: walletForOrder,
      amount: usdcBalance,
    });
    expect(mockCreateAndPostMarketOrder).toHaveBeenCalledTimes(1);
  });

  it('wraps trading approval failures in buy position errors', async () => {
    mockEnsureTradingApprovals.mockRejectedValueOnce(new Error('approval failed'));

    const promise = executePolymarketBuyPosition(buyParams());

    await expect(promise).rejects.toThrow(PolymarketBuyPositionError);
    await expect(promise).rejects.toMatchObject({ reason: 'trading_approval_failed' });
    expect(mockGetPolygonUsdcBalance).not.toHaveBeenCalled();
    expect(mockUpdateBalanceAllowance).not.toHaveBeenCalled();
    expect(mockCreateAndPostMarketOrder).not.toHaveBeenCalled();
  });

  it('wraps collateral conversion failures in buy position errors', async () => {
    mockGetPolygonUsdcBalance.mockResolvedValueOnce(ethers.BigNumber.from(1));
    mockWrapUsdcToPusd.mockRejectedValueOnce(new Error('wrap failed'));

    const promise = executePolymarketBuyPosition(buyParams());

    await expect(promise).rejects.toThrow(PolymarketBuyPositionError);
    await expect(promise).rejects.toMatchObject({ reason: 'collateral_conversion_failed' });
    expect(mockUpdateBalanceAllowance).not.toHaveBeenCalled();
    expect(mockCreateAndPostMarketOrder).not.toHaveBeenCalled();
  });

  it.each(['v1', 'v2'] as const)('executes a %s sell order and starts trade fee collection for an immediate match', async version => {
    mockCreateAndPostMarketOrder.mockResolvedValue(
      createOrderResult({
        makingAmount: '10',
        orderID: 'sell-order',
        status: 'matched',
        takingAmount: '5',
        transactionsHashes: ['0xsettlement'],
      })
    );

    const position = createPosition({
      proxyWallet: walletForOrder.address,
      size: 10,
      negativeRisk: true,
      market: { ...createMarket(), version },
    });
    await executePolymarketSellPosition({ position, orderQuote: buyParams().orderQuote });

    expect(mockUpdateBalanceAllowance).toHaveBeenCalledWith({
      asset_type: version === 'v1' ? AssetType.CONDITIONAL : 'CONDITIONAL-V2',
      token_id: '101',
    });
    expect(mockCreateAndPostMarketOrder).toHaveBeenCalledWith(
      {
        side: Side.SELL,
        ...(version === 'v1' ? { tokenID: '101' } : { positionID: '101' }),
        amount: 10,
        price: 0.5,
      },
      version === 'v1' ? { version: 2, negRisk: true } : undefined,
      OrderType.FOK
    );
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('predictions.place_order', {
      eventSlug: 'event-slug',
      marketSlug: 'market-slug',
      outcome: 'Yes',
      orderAmountUsd: 5,
      feeAmountUsd: 0.12,
      tokenAmount: 10,
      tokenId: '101',
      side: 'sell',
      spread: 0.01,
      bestPriceUsd: 0.49,
      orderPriceUsd: 0.5,
      averagePriceUsd: 0.5,
    });
    expect(mockCollectPolymarketTradeFee).toHaveBeenCalledWith({
      wallet: walletForOrder,
      matchedAmounts: { tokens: '10', usd: '5' },
      orderId: 'sell-order',
      quotedFeeUsd: '0.1',
      settlementTransactionHashes: ['0xsettlement'],
      side: 'sell',
      tokenId: '101',
    });
  });

  it('polls and collects from the order wallet after the selected account changes', async () => {
    mockCreateAndPostMarketOrder.mockImplementationOnce(async () => {
      vi.mocked(getPolymarketOrderClients).mockRejectedValue(new Error('Order account is no longer selected'));
      return createOrderResult({ orderID: 'polled-order', status: 'live' });
    });
    mockGetOrder.mockResolvedValue({ associate_trades: ['trade-1'], price: '0.5', size_matched: '10', status: 'matched' });
    mockGetTrades.mockResolvedValue([{ id: 'trade-1', status: 'confirmed', transaction_hash: '0xsettlement' }]);

    await executePolymarketBuyPosition(buyParams());
    await flushPromises();

    expect(mockGetOrder).toHaveBeenCalledWith('polled-order');
    expect(mockCollectPolymarketTradeFee).toHaveBeenCalledWith({
      wallet: walletForOrder,
      matchedAmounts: { tokens: '10', usd: '5' },
      orderId: 'polled-order',
      quotedFeeUsd: '0.1',
      settlementTransactionHashes: ['0xsettlement'],
      side: 'buy',
      tokenId: '101',
    });
  });

  it('does not collect fees when a matched trade fails before settlement', async () => {
    mockCreateAndPostMarketOrder.mockResolvedValue(createOrderResult({ orderID: 'failed-trade-order', status: 'live' }));
    mockGetOrder.mockResolvedValue({
      associate_trades: ['trade-1'],
      price: '0.5',
      size_matched: '10',
      status: 'matched',
    });
    mockGetTrades.mockResolvedValue([{ id: 'trade-1', status: 'failed' }]);

    await executePolymarketBuyPosition(buyParams());
    await flushPromises();

    expect(mockCollectPolymarketTradeFee).not.toHaveBeenCalled();
    expect(mockAnalyticsTrack).toHaveBeenCalledWith(
      'predictions.order_match.failed',
      expect.objectContaining({ orderId: 'failed-trade-order', reason: 'failed', status: 'failed' })
    );
  });

  it('tracks a terminal match failure without collecting fees', async () => {
    mockCreateAndPostMarketOrder.mockResolvedValue(createOrderResult({ orderID: 'failed-order', status: 'live' }));
    mockGetOrder.mockResolvedValue({ status: 'rejected' });

    await executePolymarketBuyPosition(buyParams());
    await flushPromises();

    expect(mockCollectPolymarketTradeFee).not.toHaveBeenCalled();
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('predictions.order_match.failed', {
      orderId: 'failed-order',
      eventSlug: 'event-slug',
      marketSlug: 'market-slug',
      outcome: 'Yes',
      tokenId: '101',
      side: 'buy',
      reason: 'rejected',
      status: 'rejected',
      errorMessage: undefined,
    });
  });
});

function createOrderResult({
  makingAmount = '0',
  orderID,
  status,
  takingAmount = '0',
  transactionsHashes,
}: {
  makingAmount?: string;
  orderID: string;
  status: string;
  takingAmount?: string;
  transactionsHashes?: string[];
}): SuccessfulOrderResult {
  return {
    success: true,
    errorMsg: '',
    makingAmount,
    orderID,
    status,
    takingAmount,
    transactionsHashes,
  };
}

async function flushPromises(): Promise<void> {
  await new Promise<void>(resolve => {
    setImmediate(resolve);
  });
}
