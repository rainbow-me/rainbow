import { TextColor } from '@/design-system/color/palettes';
import { calculateIsolatedLiquidationPriceFromMargin } from '@/features/perps/utils/calculateLiquidationPrice';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { useHlNewPositionStore } from '../hlNewPositionStore';

export type LiquidationData = {
  distanceFromCurrentPriceColor: TextColor;
  distanceFromCurrentPriceDisplay: string;
  formattedLiquidationPrice: string;
};

export const useLiquidationInfo = createDerivedStore(
  $ => {
    const { amount, market, positionSide } = $(useHlNewPositionStore);

    return (leverage: number, midPrice: string): LiquidationData | null => {
      'worklet';
      if (!market || !leverage || leverage === 1) return null;

      const liquidationPrice = calculateIsolatedLiquidationPriceFromMargin({
        entryPrice: midPrice,
        leverage,
        marginAmount: amount,
        market,
        positionSide,
      });

      const distance = ((Number(midPrice) - Number(liquidationPrice)) / Number(midPrice)) * 100;

      return {
        distanceFromCurrentPriceColor: getDistanceColor(distance),
        distanceFromCurrentPriceDisplay: formatDistance(distance),
        formattedLiquidationPrice: formatPerpAssetPrice(liquidationPrice),
      };
    };
  },

  { fastMode: true }
);

function formatDistance(distance: number): string {
  'worklet';
  const sign = distance > 0 ? '-' : '+';
  return `${sign}${Math.abs(distance).toFixed(2)}%`;
}

function getDistanceColor(distance: number): TextColor {
  'worklet';
  return distance > 0 ? 'red' : 'green';
}
