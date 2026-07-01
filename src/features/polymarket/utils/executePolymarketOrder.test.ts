import { AssetType, OrderType, Side } from '@polymarket/clob-client-v2';
import { ethers } from 'ethers';

import { analytics } from '@/analytics';
import { PolymarketBuyPositionError } from '@/features/polymarket/errors';
import { type SuccessfulOrderResult } from '@/features/polymarket/types';
import { getPolygonUsdcBalance, wrapUsdcAmountToPusd } from '@/features/polymarket/utils/collateral';
import { collectPolymarketTradeFee } from '@/features/polymarket/utils/collectPolymarketTradeFee';
import { ensureTradingApprovals } from '@/features/polymarket/utils/tradingApprovals';

import { executePolymarketBuyPosition, executePolymarketSellPosition } from './executePolymarketOrder';

const mockCreateAndPostMarketOrder = jest.fn();
const mockGetOrder = jest.fn();
const mockUpdateBalanceAllowance = jest.fn();

jest.mock('@/state/wallets/walletsStore', () => ({
  useWalletsStore: {
    getState: jest.fn(() => ({ accountAddress: '0x1208C8B837F68468457c83DD256e817BD5B3E0b7' })),
  },
}));

jest.mock('@/analytics', () => ({
  analytics: {
    event: {
      predictionsOrderMatchFailed: 'predictions.order_match.failed',
      predictionsPlaceOrder: 'predictions.place_order',
    },
    track: jest.fn(),
  },
}));

jest.mock('@/features/polymarket/stores/derived/usePolymarketClients', () => ({
  getPolymarketClobClient: jest.fn(async () => ({
    createAndPostMarketOrder: mockCreateAndPostMarketOrder,
    getOrder: mockGetOrder,
    updateBalanceAllowance: mockUpdateBalanceAllowance,
  })),
}));

jest.mock('@/features/polymarket/stores/polymarketBalanceStore', () => ({
  usePolymarketBalanceStore: {
    getState: jest.fn(() => ({ getBalance: () => '100' })),
  },
}));

jest.mock('@/features/polymarket/utils/collateral', () => ({
  getPolygonUsdcBalance: jest.fn(async () => ({ isZero: () => true })),
  wrapUsdcAmountToPusd: jest.fn(),
}));

jest.mock('@/features/polymarket/utils/collectPolymarketTradeFee', () => ({
  collectPolymarketTradeFee: jest.fn(),
}));

jest.mock('@/features/polymarket/utils/polymarketWallet', () => ({
  getPolymarketWallet: jest.fn(async () => ({ address: '0x0000000000000000000000000000000000000001' })),
}));

jest.mock('@/features/polymarket/utils/tradingApprovals', () => ({
  ensureTradingApprovals: jest.fn(),
}));

jest.mock('@/utils/delay', () => ({
  delay: jest.fn(async () => undefined),
}));

const mockAnalyticsTrack = jest.mocked(analytics.track);
const mockCollectPolymarketTradeFee = jest.mocked(collectPolymarketTradeFee);
const mockEnsureTradingApprovals = jest.mocked(ensureTradingApprovals);
const mockGetPolygonUsdcBalance = jest.mocked(getPolygonUsdcBalance);
const mockWrapUsdcAmountToPusd = jest.mocked(wrapUsdcAmountToPusd);

describe('executePolymarketOrder', () => {
  beforeEach(() => {
    mockAnalyticsTrack.mockReset();
    mockCollectPolymarketTradeFee.mockReset();
    mockCreateAndPostMarketOrder.mockReset();
    mockEnsureTradingApprovals.mockReset();
    mockGetPolygonUsdcBalance.mockReset();
    mockGetOrder.mockReset();
    mockUpdateBalanceAllowance.mockReset();
    mockWrapUsdcAmountToPusd.mockReset();

    mockGetPolygonUsdcBalance.mockResolvedValue(ethers.constants.Zero);
  });

  it('executes a buy order and starts trade fee collection for an immediate match', async () => {
    mockCreateAndPostMarketOrder.mockResolvedValue(
      createOrderResult({
        makingAmount: '5',
        orderID: 'buy-order',
        status: 'matched',
        takingAmount: '10',
      })
    );

    await executePolymarketBuyPosition({
      tokenId: 'token-1',
      amount: '5',
      price: '0.5',
      negRisk: false,
      matchedOrderMetadata: createMatchedOrderMetadata({ quotedTradeFeeUsd: '0.1' }),
    });

    expect(mockUpdateBalanceAllowance).toHaveBeenCalledWith({ asset_type: AssetType.COLLATERAL });
    expect(mockCreateAndPostMarketOrder).toHaveBeenCalledWith(
      {
        side: Side.BUY,
        tokenID: 'token-1',
        amount: 5,
        price: 0.5,
        userUSDCBalance: 5,
      },
      { negRisk: false },
      OrderType.FOK
    );
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('predictions.place_order', {
      eventSlug: 'event',
      marketSlug: 'market',
      outcome: 'Yes',
      orderAmountUsd: 5,
      feeAmountUsd: 0.12,
      tokenAmount: 10,
      tokenId: 'token-1',
      side: 'buy',
      spread: 0.01,
      bestPriceUsd: 0.49,
      orderPriceUsd: 0.5,
      averagePriceUsd: 0.5,
    });
    expect(mockCollectPolymarketTradeFee).toHaveBeenCalledWith({
      matchedAmounts: { tokens: '10', usd: '5' },
      orderId: 'buy-order',
      quotedFeeUsd: '0.1',
      side: 'buy',
      tokenId: 'token-1',
    });
  });

  it('wraps existing Polygon USDC before placing a buy order', async () => {
    const usdcBalance = ethers.utils.parseUnits('3', 6);
    mockGetPolygonUsdcBalance.mockResolvedValueOnce(usdcBalance);
    mockWrapUsdcAmountToPusd.mockImplementationOnce(async () => {
      expect(mockUpdateBalanceAllowance).not.toHaveBeenCalled();
      expect(mockCreateAndPostMarketOrder).not.toHaveBeenCalled();
    });
    mockCreateAndPostMarketOrder.mockResolvedValue(
      createOrderResult({
        makingAmount: '5',
        orderID: 'buy-order',
        status: 'matched',
        takingAmount: '10',
      })
    );

    await executePolymarketBuyPosition({
      tokenId: 'token-1',
      amount: '5',
      price: '0.5',
      negRisk: false,
      matchedOrderMetadata: createMatchedOrderMetadata({ quotedTradeFeeUsd: '0.1' }),
    });

    expect(mockWrapUsdcAmountToPusd).toHaveBeenCalledWith({
      proxyAddress: '0x0000000000000000000000000000000000000001',
      amount: usdcBalance,
    });
    expect(mockCreateAndPostMarketOrder).toHaveBeenCalledTimes(1);
  });

  it('wraps trading approval failures in buy position errors', async () => {
    mockEnsureTradingApprovals.mockRejectedValueOnce(new Error('approval failed'));

    const promise = executePolymarketBuyPosition({
      tokenId: 'token-1',
      amount: '5',
      price: '0.5',
      negRisk: false,
      matchedOrderMetadata: createMatchedOrderMetadata({ quotedTradeFeeUsd: '0.1' }),
    });

    await expect(promise).rejects.toThrow(PolymarketBuyPositionError);
    await expect(promise).rejects.toMatchObject({ reason: 'trading_approval_failed' });
    expect(mockGetPolygonUsdcBalance).not.toHaveBeenCalled();
    expect(mockUpdateBalanceAllowance).not.toHaveBeenCalled();
    expect(mockCreateAndPostMarketOrder).not.toHaveBeenCalled();
  });

  it('wraps collateral conversion failures in buy position errors', async () => {
    mockGetPolygonUsdcBalance.mockResolvedValueOnce(ethers.BigNumber.from(1));
    mockWrapUsdcAmountToPusd.mockRejectedValueOnce(new Error('wrap failed'));

    const promise = executePolymarketBuyPosition({
      tokenId: 'token-1',
      amount: '5',
      price: '0.5',
      negRisk: false,
      matchedOrderMetadata: createMatchedOrderMetadata({ quotedTradeFeeUsd: '0.1' }),
    });

    await expect(promise).rejects.toThrow(PolymarketBuyPositionError);
    await expect(promise).rejects.toMatchObject({ reason: 'collateral_conversion_failed' });
    expect(mockUpdateBalanceAllowance).not.toHaveBeenCalled();
    expect(mockCreateAndPostMarketOrder).not.toHaveBeenCalled();
  });

  it('executes a sell order and starts trade fee collection for an immediate match', async () => {
    mockCreateAndPostMarketOrder.mockResolvedValue(
      createOrderResult({
        makingAmount: '10',
        orderID: 'sell-order',
        status: 'matched',
        takingAmount: '5',
      })
    );

    await executePolymarketSellPosition({
      position: { asset: 'token-1', negativeRisk: true, size: 10 },
      price: '0.5',
      matchedOrderMetadata: createMatchedOrderMetadata({ quotedTradeFeeUsd: '0.1' }),
    });

    expect(mockUpdateBalanceAllowance).toHaveBeenCalledWith({ asset_type: AssetType.CONDITIONAL, token_id: 'token-1' });
    expect(mockCreateAndPostMarketOrder).toHaveBeenCalledWith(
      {
        side: Side.SELL,
        tokenID: 'token-1',
        amount: 10,
        price: 0.5,
      },
      { negRisk: true },
      OrderType.FOK
    );
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('predictions.place_order', {
      eventSlug: 'event',
      marketSlug: 'market',
      outcome: 'Yes',
      orderAmountUsd: 5,
      feeAmountUsd: 0.12,
      tokenAmount: 10,
      tokenId: 'token-1',
      side: 'sell',
      spread: 0.01,
      bestPriceUsd: 0.49,
      orderPriceUsd: 0.5,
      averagePriceUsd: 0.5,
    });
    expect(mockCollectPolymarketTradeFee).toHaveBeenCalledWith({
      matchedAmounts: { tokens: '10', usd: '5' },
      orderId: 'sell-order',
      quotedFeeUsd: '0.1',
      side: 'sell',
      tokenId: 'token-1',
    });
  });

  it('polls after an accepted live order and collects after the match', async () => {
    mockCreateAndPostMarketOrder.mockResolvedValue(createOrderResult({ orderID: 'polled-order', status: 'live' }));
    mockGetOrder.mockResolvedValue({ price: '0.5', size_matched: '10', status: 'matched' });

    await executePolymarketBuyPosition({
      tokenId: 'token-1',
      amount: '5',
      price: '0.5',
      negRisk: false,
      matchedOrderMetadata: createMatchedOrderMetadata({ quotedTradeFeeUsd: '0.1' }),
    });
    await flushPromises();

    expect(mockGetOrder).toHaveBeenCalledWith('polled-order');
    expect(mockCollectPolymarketTradeFee).toHaveBeenCalledWith({
      matchedAmounts: { tokens: '10', usd: '5' },
      orderId: 'polled-order',
      quotedFeeUsd: '0.1',
      side: 'buy',
      tokenId: 'token-1',
    });
  });

  it('tracks a terminal match failure without collecting fees', async () => {
    mockCreateAndPostMarketOrder.mockResolvedValue(createOrderResult({ orderID: 'failed-order', status: 'live' }));
    mockGetOrder.mockResolvedValue({ status: 'rejected' });

    await executePolymarketBuyPosition({
      tokenId: 'token-1',
      amount: '5',
      price: '0.5',
      negRisk: false,
      matchedOrderMetadata: createMatchedOrderMetadata({ quotedTradeFeeUsd: '0.1' }),
    });
    await flushPromises();

    expect(mockCollectPolymarketTradeFee).not.toHaveBeenCalled();
    expect(mockAnalyticsTrack).toHaveBeenCalledWith('predictions.order_match.failed', {
      orderId: 'failed-order',
      eventSlug: 'event',
      marketSlug: 'market',
      outcome: 'Yes',
      tokenId: 'token-1',
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
}: {
  makingAmount?: string;
  orderID: string;
  status: string;
  takingAmount?: string;
}): SuccessfulOrderResult {
  return {
    success: true,
    errorMsg: '',
    makingAmount,
    orderID,
    status,
    takingAmount,
    transactionsHashes: [],
  };
}

function createMatchedOrderMetadata({ quotedTradeFeeUsd }: { quotedTradeFeeUsd: string }) {
  return {
    eventSlug: 'event',
    marketSlug: 'market',
    outcome: 'Yes',
    estimatedFeeAmountUsd: '0.12',
    quotedTradeFeeUsd,
    bestPriceUsd: '0.49',
    orderPriceUsd: '0.5',
    spread: '0.01',
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
