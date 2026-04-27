import { adjustBuyAmountForFees } from '@polymarket/clob-client-v2';

import { ceilWorklet, divWorklet, isPositive, mulWorklet, subWorklet } from '@/framework/core/safeMath';

import {
  calculateFillFeesUsd,
  calculateTakerFeeUsd,
  DEFAULT_MINIMUM_ORDER_SIZE_USD,
  EMPTY_POLYMARKET_FEE_INFO,
  getBestOrderBookPrice,
  simulateMarketFills,
  type PolymarketFeeInfo,
  type PolymarketOrderBookLevel,
} from '../../../utils/orderExecution';

export type PolymarketOrderBookDepth = {
  asks: readonly PolymarketOrderBookLevel[];
  bids: readonly PolymarketOrderBookLevel[];
};

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

const ITERATION_LIMIT = 4;

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
  orderBook: PolymarketOrderBookDepth | null;
  buyAmountUsd: string;
}): BuyOrderExecution {
  if (!orderBook) return EMPTY_EXECUTION;

  const effectiveFeeInfo = feeInfo ?? EMPTY_POLYMARKET_FEE_INFO;
  const bestAskPrice = getBestOrderBookPrice(orderBook.asks);
  const bestBidPrice = getBestOrderBookPrice(orderBook.bids);
  const hasNoLiquidityAtMarketPrice = orderBook.asks.length === 0;

  const execution = resolveBuyExecution({
    asks: orderBook.asks,
    buyAmountUsd: Number(buyAmountUsd),
    feeInfo: effectiveFeeInfo,
  });

  const minimumBuySpendUsd =
    orderBook.asks.length > 0
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
    hasNoLiquidityAtMarketPrice,
    spread: orderBook.asks.length > 0 && orderBook.bids.length > 0 ? subWorklet(bestAskPrice, bestBidPrice) : '0',
    minBuyAmountUsd: roundUsdUpToCents(minimumBuySpendUsd),
  };
}

function resolveBuyExecution({
  asks,
  buyAmountUsd,
  feeInfo,
}: {
  asks: readonly PolymarketOrderBookLevel[];
  buyAmountUsd: number;
  feeInfo: PolymarketFeeInfo;
}) {
  if (!asks.length || !Number.isFinite(buyAmountUsd) || buyAmountUsd <= 0) {
    return {
      averagePrice: 0,
      feeAmountUsd: 0,
      hasInsufficientLiquidity: false,
      priceLimit: 0,
      tokensBought: 0,
    };
  }

  let priceLimit = findWorstAskPriceForNotional(asks, buyAmountUsd);
  let feeAdjustedNotionalUsd = calculateFeeAdjustedBuyNotionalUsd({
    feeInfo,
    priceLimit,
    spendCapUsd: buyAmountUsd,
  });

  for (let i = 0; i < ITERATION_LIMIT; i++) {
    const nextPriceLimit = findWorstAskPriceForNotional(asks, feeAdjustedNotionalUsd);
    const nextFeeAdjustedNotionalUsd = calculateFeeAdjustedBuyNotionalUsd({
      feeInfo,
      priceLimit: nextPriceLimit,
      spendCapUsd: buyAmountUsd,
    });

    if (priceLimit === nextPriceLimit) {
      priceLimit = nextPriceLimit;
      feeAdjustedNotionalUsd = nextFeeAdjustedNotionalUsd;
      break;
    }

    priceLimit = nextPriceLimit;
    feeAdjustedNotionalUsd = nextFeeAdjustedNotionalUsd;
  }

  const execution = simulateBuyFills({
    asks,
    feeInfo,
    notionalUsd: feeAdjustedNotionalUsd,
  });

  return {
    averagePrice: execution.tokensBought > 0 ? execution.notionalSpentUsd / execution.tokensBought : 0,
    feeAmountUsd: execution.feeAmountUsd,
    hasInsufficientLiquidity: execution.hasInsufficientLiquidity,
    priceLimit,
    tokensBought: execution.tokensBought,
  };
}

function simulateBuyFills({
  asks,
  feeInfo,
  notionalUsd,
}: {
  asks: readonly PolymarketOrderBookLevel[];
  feeInfo: PolymarketFeeInfo;
  notionalUsd: number;
}) {
  const execution = simulateMarketFills({ levels: asks, targetAmount: notionalUsd, targetType: 'notionalUsd' });

  return {
    feeAmountUsd: calculateFillFeesUsd({ feeInfo, fills: execution.fills }),
    hasInsufficientLiquidity: execution.hasInsufficientLiquidity,
    notionalSpentUsd: execution.totalNotionalUsd,
    tokensBought: execution.totalShares,
  };
}

function findWorstAskPriceForNotional(asks: readonly PolymarketOrderBookLevel[], notionalUsd: number): number {
  return (
    simulateMarketFills({ levels: asks, targetAmount: notionalUsd, targetType: 'notionalUsd' }).worstPrice ||
    Number(getBestOrderBookPrice(asks))
  );
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

function calculateFeeAdjustedBuyNotionalUsd({
  feeInfo,
  priceLimit,
  spendCapUsd,
}: {
  feeInfo: PolymarketFeeInfo;
  priceLimit: number;
  spendCapUsd: number;
}): number {
  if (!isPositive(String(priceLimit))) return 0;

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
  return String(divWorklet(ceilWorklet(mulWorklet(String(value), '100')), '100'));
}
