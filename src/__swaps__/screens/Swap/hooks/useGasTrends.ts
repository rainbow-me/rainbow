import { useCallback } from 'react';
import * as i18n from '@/languages';

import { MeteorologyLegacyResponse, MeteorologyResponse } from '@/resources/gas/meteorology';

import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { logger } from '@/logger';
import { isL2ChainWorklet } from '@/__swaps__/utils/chains';
import { ChainId } from '@/__swaps__/types/chains';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { toFixedDecimals } from '@/helpers/utilities';
import { weiToGwei } from '@/parsers';
import { getTrendKey } from '@/helpers/gas';
import { gasStore } from '@/state/gas/gasStore';

const unknown = i18n.t(i18n.l.swap.unknown);

export const useGasTrends = ({
  inputAsset,
  gasData,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  gasData: SharedValue<MeteorologyResponse | MeteorologyLegacyResponse | null>;
}) => {
  const currentBaseFee = useSharedValue<string>(unknown);
  const currentTrend = useSharedValue<string>(unknown);
  const isL2Chain = useDerivedValue(() => isL2ChainWorklet(inputAsset.value?.chainId ?? ChainId.mainnet));

  const computeGasBaseFeeAndTrend = useCallback(
    async (baseFee: string, baseFeeTrend: number, isL2Chain: boolean) => {
      logger.debug(`[useGasTrends] Computing gas trends`);

      const updateValues = ({ baseFeeInGwei, trend }: { baseFeeInGwei: string; trend: string }) => {
        'worklet';

        currentBaseFee.value = baseFeeInGwei;
        currentTrend.value = trend;
      };

      const baseFeeInGwei = toFixedDecimals(weiToGwei(baseFee), isL2Chain ? 4 : 0);
      const trend = getTrendKey(baseFeeTrend);

      gasStore.setState({
        currentBaseFee: baseFeeInGwei,
        currentBaseFeeTrend: baseFeeTrend,
      });

      runOnUI(updateValues)({
        baseFeeInGwei,
        trend,
      });
    },
    [currentBaseFee, currentTrend]
  );

  useAnimatedReaction(
    () => ({
      baseFee: (gasData.value as MeteorologyResponse)?.data.currentBaseFee,
      baseFeeTrend: (gasData.value as MeteorologyResponse)?.data.baseFeeTrend,
      isL2Chain: isL2Chain.value,
    }),
    (current, previous) => {
      if (
        current.baseFee !== previous?.baseFee ||
        current.baseFeeTrend !== previous?.baseFeeTrend ||
        current.isL2Chain !== previous?.isL2Chain
      ) {
        runOnJS(computeGasBaseFeeAndTrend)(current.baseFee, current.baseFeeTrend, current.isL2Chain);
      }
    }
  );

  return {
    currentBaseFee,
    currentTrend,
  };
};
