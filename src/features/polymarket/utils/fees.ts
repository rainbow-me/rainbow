import { type MarketFill } from '@/features/polymarket/utils/orderBookFills';

export type PolymarketFeeInfo = {
  minimumOrderSize: number;
  platformFeeExponent: number;
  platformFeeRate: number;
};

export const DEFAULT_MINIMUM_ORDER_SIZE_USD = 1;

export const EMPTY_POLYMARKET_FEE_INFO: PolymarketFeeInfo = {
  minimumOrderSize: DEFAULT_MINIMUM_ORDER_SIZE_USD,
  platformFeeExponent: 0,
  platformFeeRate: 0,
};

export function calculateFillFeesUsd({ feeInfo, fills }: { feeInfo: PolymarketFeeInfo; fills: readonly MarketFill[] }): number {
  return fills.reduce((feeAmountUsd, fill) => {
    return feeAmountUsd + calculateTakerFeeUsd({ feeInfo, price: fill.price, shares: fill.shares });
  }, 0);
}

export function calculateTakerFeeUsd({ feeInfo, price, shares }: { feeInfo: PolymarketFeeInfo; price: number; shares: number }): number {
  const platformFeePerShare = feeInfo.platformFeeRate * Math.pow(price * (1 - price), feeInfo.platformFeeExponent);
  return shares * platformFeePerShare;
}
