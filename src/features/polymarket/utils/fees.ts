import { type MarketFill } from '@/features/polymarket/utils/orderBookFills';
import { toFixedWorklet } from '@/framework/core/safeMath';

export type PolymarketFeeInfo = {
  minimumOrderSize: number;
  platformFeeExponent: number;
  platformFeeRate: number;
};

export const DEFAULT_MINIMUM_ORDER_SIZE_USD = 1;

const PLATFORM_FEE_SETTLEMENT_DECIMALS = 5;

export const EMPTY_POLYMARKET_FEE_INFO: PolymarketFeeInfo = {
  minimumOrderSize: DEFAULT_MINIMUM_ORDER_SIZE_USD,
  platformFeeExponent: 0,
  platformFeeRate: 0,
};

/** Calculates an aggregate fill's platform fee at Polymarket settlement precision. */
export function calculateFillFeesUsd({ feeInfo, fills }: { feeInfo: PolymarketFeeInfo; fills: readonly MarketFill[] }): number {
  const feeAmountUsd = fills.reduce((feeAmountUsd, fill) => {
    return feeAmountUsd + calculateTakerFeeUsd({ feeInfo, price: fill.price, shares: fill.shares });
  }, 0);

  return Number(toFixedWorklet(feeAmountUsd, PLATFORM_FEE_SETTLEMENT_DECIMALS));
}

export function calculateTakerFeeUsd({ feeInfo, price, shares }: { feeInfo: PolymarketFeeInfo; price: number; shares: number }): number {
  const platformFeePerShare = feeInfo.platformFeeRate * Math.pow(price * (1 - price), feeInfo.platformFeeExponent);
  return shares * platformFeePerShare;
}
