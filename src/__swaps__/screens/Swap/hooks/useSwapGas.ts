import { useCallback } from 'react';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { GasFeeLegacyParams, GasFeeLegacyParamsBySpeed, GasFeeParams, GasFeeParamsBySpeed, GasSpeed } from '@/__swaps__/types/gas';

import { SharedValue, runOnUI, useSharedValue } from 'react-native-reanimated';
import { useGasData } from './useGasData';
import { useNativeAssetForChain } from './useNativeAsset';
import { useOptimismSecurityFee } from './useOptimismSecurityFee';
import { useEstimateSwapGasLimit } from './useEstimateSwapGasLimit';
import { gasStore } from '@/state/gas/gasStore';

type CustomGasSettings = {
  maxBaseFee: string;
  maxPriorityFee: string;
};

export const useSwapGas = ({
  inputAsset,
  outputAsset,
  quote,
  defaultSpeed = GasSpeed.NORMAL,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  defaultSpeed?: GasSpeed;
}) => {
  const selectedGasSpeed = useSharedValue<GasSpeed>(defaultSpeed);
  const selectedGas = useSharedValue<GasFeeParams | GasFeeLegacyParams>({} as GasFeeParams | GasFeeLegacyParams);
  const gasFeeParamsBySpeed = useSharedValue<GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed | null>(null);
  const customGasSettings = useSharedValue<CustomGasSettings>({} as CustomGasSettings);

  const { nativeAsset } = useNativeAssetForChain({ inputAsset });
  const { optimismFee: optimismL1SecurityFee, optimismFeeInterval } = useOptimismSecurityFee({ inputAsset, quote });
  const { estimatedGasLimit, estimatedGasLimitInterval } = useEstimateSwapGasLimit({ inputAsset, outputAsset, quote });

  // NOTE: main driver that updates all the gasData and gasFeeParamsBySpeed
  const { gasData, gasDataInterval } = useGasData({
    inputAsset,
    quote,
    gasFeeParamsBySpeed,
    estimatedGasLimit,
    nativeAsset,
    optimismL1SecurityFee,
  });

  const setSelectedGasSpeed = useCallback(
    (option: GasSpeed) => {
      const updateWorkletValue = (speed: GasSpeed) => {
        'worklet';

        selectedGasSpeed.value = speed;
      };

      gasStore.getState().setSelectedGasSpeed(option);
      runOnUI(updateWorkletValue)(option);
    },
    [selectedGasSpeed]
  );

  return {
    // meteorology data
    gasData,

    // gas settings
    selectedGasSpeed,
    selectedGas,
    gasFeeParamsBySpeed,
    customGasSettings,

    // setters
    setSelectedGasSpeed,

    // intervals
    gasDataInterval,
    estimatedGasLimitInterval,
    optimismFeeInterval,
  };
};
