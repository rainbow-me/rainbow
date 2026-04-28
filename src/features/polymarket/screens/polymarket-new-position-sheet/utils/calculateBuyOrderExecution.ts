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
import { ceilWorklet, divWorklet, mulWorklet } from '@/framework/core/safeMath';

export type BuyOrderExecution = {
  averagePrice: string;
  worstPrice: string;
  fee: string;
  tokensBought: string;
  hasInsufficientLiquidity: boolean;
  hasNoLiquidityAtMarketPrice: boolean;
  spread: string;
  minBuyAmountUsd: string;
  bestPrice: string;
};

const PRICE_LIMIT_STABILIZATION_ITERATION_LIMIT = 4;

const EMPTY_EXECUTION: BuyOrderExecution = {
  averagePrice: '0',
  worstPrice: '0',
  fee: '0',
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
      priceLimit: 0,
      tokensBought: 0,
    };
  }

  const { sdkAdjustedOrderNotionalUsd, priceLimit } = resolveSdkAdjustedBuyOrderNotional({
    asks,
    feeInfo,
    spendCapUsd: buyAmountUsd,
  });

  const execution = simulateMarketFills({ levels: asks, targetAmount: sdkAdjustedOrderNotionalUsd, targetType: 'notionalUsd' });
  const estimatedMatchFeeAmountUsd = calculateFillFeesUsd({ feeInfo, fills: execution.fills });

  return {
    averagePrice: execution.totalShares > 0 ? execution.totalNotionalUsd / execution.totalShares : 0,
    feeAmountUsd: estimatedMatchFeeAmountUsd,
    hasInsufficientLiquidity: execution.hasInsufficientLiquidity,
    priceLimit,
    tokensBought: execution.totalShares,
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
  const minimumNotionalUsd = DEFAULT_MINIMUM_ORDER_SIZE_USD;
  const minimumShares = minimumNotionalUsd / bestAskPrice;

  return (
    minimumNotionalUsd +
    calculateTakerFeeUsd({
      feeInfo,
      notionalUsd: minimumNotionalUsd,
      price: bestAskPrice,
      shares: minimumShares,
    })
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
    feeInfo.builderTakerFeeRate
  );
}

function roundUsdUpToCents(value: number): string {
  if (value <= 0) return '0';
  return divWorklet(ceilWorklet(mulWorklet(value, '100')), '100');
}
