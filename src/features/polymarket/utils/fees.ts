import { type MarketFill } from '@/features/polymarket/utils/orderBookFills';

export type PolymarketFeeInfo = {
  builderTakerFeeRate: number;
  minimumOrderSize: number;
  platformFeeExponent: number;
  platformFeeRate: number;
};

export const DEFAULT_MINIMUM_ORDER_SIZE_USD = 1;

export const EMPTY_POLYMARKET_FEE_INFO: PolymarketFeeInfo = {
  builderTakerFeeRate: 0,
  minimumOrderSize: DEFAULT_MINIMUM_ORDER_SIZE_USD,
  platformFeeExponent: 0,
  platformFeeRate: 0,
};

export function calculateFillFeesUsd({ feeInfo, fills }: { feeInfo: PolymarketFeeInfo; fills: readonly MarketFill[] }): number {
  return fills.reduce((feeAmountUsd, fill) => {
    return feeAmountUsd + calculateTakerFeeUsd({ feeInfo, notionalUsd: fill.notionalUsd, price: fill.price, shares: fill.shares });
  }, 0);
}

export function calculateTakerFeeUsd({
  feeInfo,
  notionalUsd,
  price,
  shares,
}: {
  feeInfo: PolymarketFeeInfo;
  notionalUsd: number;
  price: number;
  shares: number;
}): number {
  const platformFeePerShare = feeInfo.platformFeeRate * Math.pow(price * (1 - price), feeInfo.platformFeeExponent);
  const platformFeeUsd = shares * platformFeePerShare;
  const builderFeeUsd = notionalUsd * feeInfo.builderTakerFeeRate;
  return platformFeeUsd + builderFeeUsd;
}
