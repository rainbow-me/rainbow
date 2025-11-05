import { TextColor } from '@/design-system/color/palettes';
import { PerpMarket, PerpPositionSide } from '@/features/perps/types';
import { calculateIsolatedLiquidationPriceFromMargin } from '@/features/perps/utils/calculateLiquidationPrice';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';

function formatDistance(distance: number): string {
  'worklet';
  const sign = distance > 0 ? '-' : '+';
  return `${sign}${Math.abs(distance).toFixed(2)}%`;
}

function getDistanceColor(distance: number): TextColor {
  'worklet';
  return distance > 0 ? 'red' : 'green';
}

export type LiquidationData = {
  distanceFromCurrentPriceColor: TextColor;
  distanceFromCurrentPriceDisplay: string;
  formattedLiquidationPrice: string;
};

type BuildLiquidationInfoParams = {
  amount: string;
  currentPrice: string;
  entryPrice: string;
  leverage: number;
  market: PerpMarket | null;
  positionSide: PerpPositionSide;
};

export function buildLiquidationInfo({
  amount,
  currentPrice,
  entryPrice,
  leverage,
  market,
  positionSide,
}: BuildLiquidationInfoParams): LiquidationData | null {
  'worklet';

  if (!market || !leverage || leverage === 1) {
    return null;
  }

  const currentPriceValue = Number(currentPrice);
  if (!currentPriceValue) {
    return null;
  }

  const liquidationPrice = calculateIsolatedLiquidationPriceFromMargin({
    entryPrice,
    leverage,
    marginAmount: amount,
    market,
    positionSide,
  });

  const distance = ((currentPriceValue - Number(liquidationPrice)) / currentPriceValue) * 100;

  return {
    distanceFromCurrentPriceColor: getDistanceColor(distance),
    distanceFromCurrentPriceDisplay: formatDistance(distance),
    formattedLiquidationPrice: formatPerpAssetPrice(liquidationPrice),
  };
}
