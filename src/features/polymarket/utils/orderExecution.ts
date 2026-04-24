export type PolymarketFeeInfo = {
  builderTakerFeeRate: number;
  minimumOrderSize: number;
  platformFeeExponent: number;
  platformFeeRate: number;
};

export type PolymarketOrderBookLevel = {
  price: string;
  size: string;
};

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

export const DEFAULT_MINIMUM_ORDER_SIZE_USD = 1;

export const EMPTY_POLYMARKET_FEE_INFO: PolymarketFeeInfo = {
  builderTakerFeeRate: 0,
  minimumOrderSize: DEFAULT_MINIMUM_ORDER_SIZE_USD,
  platformFeeExponent: 0,
  platformFeeRate: 0,
};

const EXECUTION_EPSILON = 1e-9;

export function simulateMarketFills({
  levels,
  targetAmount,
  targetType,
}: {
  levels: readonly PolymarketOrderBookLevel[];
  targetAmount: number;
  targetType: 'notionalUsd' | 'shares';
}): MarketFillSimulation {
  if (!levels.length || !Number.isFinite(targetAmount) || targetAmount <= 0) {
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

    if (!Number.isFinite(price) || !Number.isFinite(availableShares) || price <= 0 || availableShares <= 0) continue;

    const availableTargetAmount = targetType === 'notionalUsd' ? price * availableShares : availableShares;
    const filledTargetAmount = Math.min(remainingAmount, availableTargetAmount);
    if (filledTargetAmount <= EXECUTION_EPSILON) continue;

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
    hasInsufficientLiquidity: remainingAmount > EXECUTION_EPSILON,
    remainingAmount,
    totalNotionalUsd,
    totalShares,
    worstPrice,
  };
}

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
  return calculatePlatformFeeUsd({ feeInfo, price, shares }) + calculateBuilderFeeUsd({ feeInfo, notionalUsd });
}

export function calculatePlatformFeeUsd({ feeInfo, price, shares }: { feeInfo: PolymarketFeeInfo; price: number; shares: number }): number {
  return shares * calculatePlatformFeeRateAtPrice({ feeInfo, price });
}

export function calculatePlatformFeeRateAtPrice({ feeInfo, price }: { feeInfo: PolymarketFeeInfo; price: number }): number {
  return feeInfo.platformFeeRate * Math.pow(price * (1 - price), feeInfo.platformFeeExponent);
}

export function calculateBuilderFeeUsd({ feeInfo, notionalUsd }: { feeInfo: PolymarketFeeInfo; notionalUsd: number }): number {
  return notionalUsd * feeInfo.builderTakerFeeRate;
}

export function getBestOrderBookPrice(levels: readonly PolymarketOrderBookLevel[]): string {
  if (!levels.length) return '0';
  return levels[levels.length - 1].price;
}

export function isSamePolymarketFeeInfo(
  previousFeeInfo: PolymarketFeeInfo | null | undefined,
  nextFeeInfo: PolymarketFeeInfo | null | undefined
): boolean {
  if (previousFeeInfo === nextFeeInfo) return true;
  if (!previousFeeInfo || !nextFeeInfo) return false;

  return (
    previousFeeInfo.builderTakerFeeRate === nextFeeInfo.builderTakerFeeRate &&
    previousFeeInfo.minimumOrderSize === nextFeeInfo.minimumOrderSize &&
    previousFeeInfo.platformFeeExponent === nextFeeInfo.platformFeeExponent &&
    previousFeeInfo.platformFeeRate === nextFeeInfo.platformFeeRate
  );
}
