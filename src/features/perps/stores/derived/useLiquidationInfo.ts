import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { useHlNewPositionStore } from '../hlNewPositionStore';
import { LiquidationData, buildLiquidationInfo } from '@/features/perps/utils/buildLiquidationInfo';

export const useLiquidationInfo = createDerivedStore(
  $ => {
    const { amount, market, positionSide } = $(useHlNewPositionStore);

    return (leverage: number, midPrice: string): LiquidationData | null => {
      'worklet';
      return buildLiquidationInfo({
        amount,
        currentPrice: midPrice,
        entryPrice: midPrice,
        leverage,
        market,
        positionSide,
      });
    };
  },

  { fastMode: true }
);
