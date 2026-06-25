import { adjustBuyAmountForFees } from '@polymarket/clob-client-v2';

import { type OrderBook, type OrderBookLevel } from '@/features/polymarket/stores/polymarketOrderBookStore';
import {
  calculateFillFeesUsd,
  calculateTakerFeeUsd,
  DEFAULT_MINIMUM_ORDER_SIZE_USD,
  EMPTY_POLYMARKET_FEE_INFO,
  type PolymarketFeeInfo,
} from '@/features/polymarket/utils/fees';
import { calculateOrderBookSpread, getBestOrderBookPrice, simulateMarketFills } from '@/features/polymarket/utils/orderBookFills';
import { calculateTradeFeeUsd } from '@/features/polymarket/utils/polymarketTradeFee';
import { ceilWorklet, divWorklet, mulWorklet } from '@/framework/core/safeMath';

export type BuyOrderExecution = {
  averagePrice: string;
  worstPrice: string;
  fee: string;
  orderSpendCap: string;
  rainbowFee: string;
  tokensBought: string;
  hasInsufficientLiquidity: boolean;
  hasNoLiquidityAtMarketPrice: boolean;
  spread: string;
  minBuyAmountUsd: string;
  bestPrice: string;
};

const BUY_SPEND_CAP_SEARCH_ITERATION_LIMIT = 24;
const NO_BUILDER_TAKER_FEE_RATE = 0;
const PRICE_LIMIT_STABILIZATION_ITERATION_LIMIT = 4;
const SPEND_CAP_EPSILON = 1e-9;

const EMPTY_EXECUTION: BuyOrderExecution = {
  averagePrice: '0',
  worstPrice: '0',
  fee: '0',
  orderSpendCap: '0',
  rainbowFee: '0',
  tokensBought: '0',
  hasInsufficientLiquidity: false,
  hasNoLiquidityAtMarketPrice: false,
  spread: '0',
  minBuyAmountUsd: '0',
  bestPrice: '0',
};

export function calculateBuyOrderExecution({
  feeInfo,
  orderBook,
  buyAmountUsd,
}: {
  feeInfo?: PolymarketFeeInfo | null;
  orderBook: OrderBook | null;
  buyAmountUsd: string;
}): BuyOrderExecution {
  if (!orderBook) return EMPTY_EXECUTION;

  const effectiveFeeInfo = feeInfo ?? EMPTY_POLYMARKET_FEE_INFO;
  const hasAskLiquidity = orderBook.asks.length > 0;
  const bestAskPrice = getBestOrderBookPrice(orderBook.asks);

  const execution = resolveBuyExecution({
    asks: orderBook.asks,
    buyAmountUsd: Number(buyAmountUsd),
    feeInfo: effectiveFeeInfo,
  });

  const minimumBuySpendUsd = hasAskLiquidity
    ? calculateMinimumBuySpendUsd({
        bestAskPrice: Number(bestAskPrice),
        feeInfo: effectiveFeeInfo,
      })
    : DEFAULT_MINIMUM_ORDER_SIZE_USD;

  return {
    averagePrice: String(execution.averagePrice),
    worstPrice: String(execution.priceLimit),
    bestPrice: bestAskPrice,
    fee: String(execution.feeAmountUsd),
    orderSpendCap: String(execution.orderSpendCapUsd),
    rainbowFee: String(execution.rainbowFeeAmountUsd),
    tokensBought: String(execution.tokensBought),
    hasInsufficientLiquidity: execution.hasInsufficientLiquidity,
    hasNoLiquidityAtMarketPrice: !hasAskLiquidity,
    spread: calculateOrderBookSpread({ asks: orderBook.asks, bids: orderBook.bids }),
    minBuyAmountUsd: roundUsdUpToCents(minimumBuySpendUsd),
  };
}

function resolveBuyExecution({
  asks,
  buyAmountUsd,
  feeInfo,
}: {
  asks: OrderBookLevel[];
  buyAmountUsd: number;
  feeInfo: PolymarketFeeInfo;
}) {
  if (!asks.length) {
    return {
      averagePrice: 0,
      feeAmountUsd: 0,
      hasInsufficientLiquidity: false,
      orderSpendCapUsd: 0,
      priceLimit: 0,
      rainbowFeeAmountUsd: 0,
      tokensBought: 0,
    };
  }

  let bestExecution = quoteBuySpendCap({ asks, feeInfo, spendCapUsd: 0 });
  let lowSpendCapUsd = 0;
  let highSpendCapUsd = Math.max(buyAmountUsd, 0);

  for (let i = 0; i < BUY_SPEND_CAP_SEARCH_ITERATION_LIMIT; i++) {
    const spendCapUsd = (lowSpendCapUsd + highSpendCapUsd) / 2;
    const execution = quoteBuySpendCap({ asks, feeInfo, spendCapUsd });

    if (execution.totalSpendUsd <= buyAmountUsd + SPEND_CAP_EPSILON) {
      bestExecution = execution;
      lowSpendCapUsd = spendCapUsd;
    } else {
      highSpendCapUsd = spendCapUsd;
    }
  }

  return bestExecution;
}

function quoteBuySpendCap({ asks, feeInfo, spendCapUsd }: { asks: OrderBookLevel[]; feeInfo: PolymarketFeeInfo; spendCapUsd: number }) {
  if (spendCapUsd <= 0) {
    return {
      averagePrice: 0,
      feeAmountUsd: 0,
      hasInsufficientLiquidity: false,
      orderSpendCapUsd: 0,
      priceLimit: 0,
      rainbowFeeAmountUsd: 0,
      tokensBought: 0,
      totalSpendUsd: 0,
    };
  }

  const { sdkAdjustedOrderNotionalUsd, priceLimit } = resolveSdkAdjustedBuyOrderNotional({
    asks,
    feeInfo,
    spendCapUsd,
  });

  const execution = simulateMarketFills({ levels: asks, targetAmount: sdkAdjustedOrderNotionalUsd, targetType: 'notionalUsd' });
  const averagePrice = execution.totalShares > 0 ? execution.totalNotionalUsd / execution.totalShares : 0;
  const providerFeeAmountUsd = calculateFillFeesUsd({ feeInfo, fills: execution.fills });
  const rainbowFeeAmountUsd = Number(calculateTradeFeeUsd({ notionalUsd: execution.totalNotionalUsd, price: averagePrice }));
  const feeAmountUsd = providerFeeAmountUsd + rainbowFeeAmountUsd;

  return {
    averagePrice,
    feeAmountUsd,
    hasInsufficientLiquidity: execution.hasInsufficientLiquidity,
    orderSpendCapUsd: spendCapUsd,
    priceLimit,
    rainbowFeeAmountUsd,
    tokensBought: execution.totalShares,
    totalSpendUsd: execution.totalNotionalUsd + feeAmountUsd,
  };
}

function resolveSdkAdjustedBuyOrderNotional({
  asks,
  feeInfo,
  spendCapUsd,
}: {
  asks: OrderBookLevel[];
  feeInfo: PolymarketFeeInfo;
  spendCapUsd: number;
}) {
  let priceLimit = findWorstAskPriceForNotional(asks, spendCapUsd);
  let sdkAdjustedOrderNotionalUsd = calculateSdkAdjustedBuyOrderNotionalUsd({
    feeInfo,
    priceLimit,
    spendCapUsd,
  });

  // The SDK adjusts buy market order notional when userUSDCBalance is provided
  // so the submitted order has room for match-time taker fees. That adjusted
  // notional can land on a different book level than the original spend cap.
  for (let i = 0; i < PRICE_LIMIT_STABILIZATION_ITERATION_LIMIT; i++) {
    const nextPriceLimit = findWorstAskPriceForNotional(asks, sdkAdjustedOrderNotionalUsd);
    const nextSdkAdjustedOrderNotionalUsd = calculateSdkAdjustedBuyOrderNotionalUsd({
      feeInfo,
      priceLimit: nextPriceLimit,
      spendCapUsd,
    });

    if (priceLimit === nextPriceLimit) {
      return {
        sdkAdjustedOrderNotionalUsd: nextSdkAdjustedOrderNotionalUsd,
        priceLimit: nextPriceLimit,
      };
    }

    priceLimit = nextPriceLimit;
    sdkAdjustedOrderNotionalUsd = nextSdkAdjustedOrderNotionalUsd;
  }

  return { sdkAdjustedOrderNotionalUsd, priceLimit };
}

function findWorstAskPriceForNotional(asks: OrderBookLevel[], notionalUsd: number): number {
  return simulateMarketFills({ levels: asks, targetAmount: notionalUsd, targetType: 'notionalUsd' }).worstPrice;
}

function calculateMinimumBuySpendUsd({ bestAskPrice, feeInfo }: { bestAskPrice: number; feeInfo: PolymarketFeeInfo }): number {
  const minimumNotionalUsd = Math.max(DEFAULT_MINIMUM_ORDER_SIZE_USD, feeInfo.minimumOrderSize);
  const minimumShares = minimumNotionalUsd / bestAskPrice;

  return (
    minimumNotionalUsd +
    calculateTakerFeeUsd({
      feeInfo,
      price: bestAskPrice,
      shares: minimumShares,
    }) +
    Number(calculateTradeFeeUsd({ notionalUsd: minimumNotionalUsd, price: bestAskPrice }))
  );
}

function calculateSdkAdjustedBuyOrderNotionalUsd({
  feeInfo,
  priceLimit,
  spendCapUsd,
}: {
  feeInfo: PolymarketFeeInfo;
  priceLimit: number;
  spendCapUsd: number;
}): number {
  if (priceLimit <= 0) return 0;

  return adjustBuyAmountForFees(
    spendCapUsd,
    priceLimit,
    spendCapUsd,
    feeInfo.platformFeeRate,
    feeInfo.platformFeeExponent,
    NO_BUILDER_TAKER_FEE_RATE
  );
}

function roundUsdUpToCents(value: number): string {
  if (value <= 0) return '0';
  return divWorklet(ceilWorklet(mulWorklet(value, '100')), '100');
}
