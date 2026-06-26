import { createDerivedStore } from '@storesjs/stores';

import { buildLiquidationInfo, type LiquidationData } from '@/features/perps/utils/buildLiquidationInfo';

import { useHlNewPositionStore } from '../hlNewPositionStore';

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

  { lockDependencies: true }
);
