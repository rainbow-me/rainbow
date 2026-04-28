import { type OrderBookLevel } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { greaterThanWorklet, subWorklet } from '@/framework/core/safeMath';

export type MarketFill = {
  notionalUsd: number;
  price: number;
  shares: number;
};

export type MarketFillSimulation = {
  fills: MarketFill[];
  hasInsufficientLiquidity: boolean;
  remainingAmount: number;
  totalNotionalUsd: number;
  totalShares: number;
  worstPrice: number;
};

const EXECUTION_EPSILON = 1e-9;

export function simulateMarketFills({
  levels,
  targetAmount,
  targetType,
}: {
  levels: OrderBookLevel[];
  targetAmount: number;
  targetType: 'notionalUsd' | 'shares';
}): MarketFillSimulation {
  if (!levels.length) {
    return {
      fills: [],
      hasInsufficientLiquidity: false,
      remainingAmount: 0,
      totalNotionalUsd: 0,
      totalShares: 0,
      worstPrice: 0,
    };
  }

  const fills: MarketFill[] = [];
  let remainingAmount = targetAmount;
  let totalNotionalUsd = 0;
  let totalShares = 0;
  let worstPrice = 0;

  for (let i = levels.length - 1; i >= 0; i--) {
    const price = Number(levels[i].price);
    const availableShares = Number(levels[i].size);

    const availableTargetAmount = targetType === 'notionalUsd' ? price * availableShares : availableShares;
    const filledTargetAmount = Math.min(remainingAmount, availableTargetAmount);
    const shares = targetType === 'notionalUsd' ? filledTargetAmount / price : filledTargetAmount;
    const notionalUsd = shares * price;

    fills.push({ notionalUsd, price, shares });
    totalNotionalUsd += notionalUsd;
    totalShares += shares;
    remainingAmount -= filledTargetAmount;
    worstPrice = price;

    if (remainingAmount <= EXECUTION_EPSILON) {
      remainingAmount = 0;
      break;
    }
  }

  return {
    fills,
    hasInsufficientLiquidity: remainingAmount > 0,
    remainingAmount,
    totalNotionalUsd,
    totalShares,
    worstPrice,
  };
}

export function getBestOrderBookPrice(levels: OrderBookLevel[]): string {
  if (!levels.length) return '0';
  return levels[levels.length - 1].price;
}

export function calculateOrderBookSpread({ asks, bids }: { asks: OrderBookLevel[]; bids: OrderBookLevel[] }): string {
  const bestAsk = getBestOrderBookPrice(asks);
  const bestBid = getBestOrderBookPrice(bids);
  if (!greaterThanWorklet(bestAsk, '0') || !greaterThanWorklet(bestBid, '0')) return '0';
  return subWorklet(bestAsk, bestBid);
}
