import { useCallback } from 'react';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { GasFeeLegacyParams, GasFeeLegacyParamsBySpeed, GasFeeParams, GasFeeParamsBySpeed, GasSpeed } from '@/__swaps__/types/gas';

import { SharedValue, runOnJS, runOnUI, useSharedValue } from 'react-native-reanimated';
import { useGasData } from './useGasData';
import { useNativeAssetForChain } from './useNativeAsset';
import { useOptimismSecurityFee } from './useOptimismSecurityFee';
import { useEstimateSwapGasLimit } from './useEstimateSwapGasLimit';
import { gasStore } from '@/state/gas/gasStore';
import { useSwapSettings } from './useSwapSettings';
import { useGasTrends } from './useGasTrends';

export const useSwapGas = ({
  SwapSettings,
  inputAsset,
  outputAsset,
  quote,
}: {
  SwapSettings: ReturnType<typeof useSwapSettings>;
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
}) => {
  const selectedGasSpeed = useSharedValue<GasSpeed>(gasStore.getState().selectedGasSpeed);
  const selectedGas = useSharedValue<GasFeeParams | GasFeeLegacyParams>({} as GasFeeParams | GasFeeLegacyParams);
  const gasFeeParamsBySpeed = useSharedValue<GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed | null>(null);

  const maxBaseFee = useSharedValue<string>('');
  const maxBaseFeeWarning = useSharedValue<'fail' | 'stuck' | undefined>(undefined);
  const maxPriorityFee = useSharedValue<string>('');
  const maxPriorityFeeWarning = useSharedValue<'fail' | 'stuck' | undefined>(undefined);

  const { nativeAsset } = useNativeAssetForChain({ inputAsset });
  const { optimismFee: optimismL1SecurityFee, optimismFeeInterval } = useOptimismSecurityFee({ inputAsset, quote });
  const { estimatedGasLimit, estimatedGasLimitInterval } = useEstimateSwapGasLimit({ inputAsset, outputAsset, quote });

  // NOTE: main driver that updates all the gasData and gasFeeParamsBySpeed
  const { gasData, gasDataInterval } = useGasData({
    SwapSettings,
    inputAsset,
    quote,
    gasFeeParamsBySpeed,
    estimatedGasLimit,
    nativeAsset,
    optimismL1SecurityFee,
    maxBaseFee,
    maxPriorityFee,
  });

  const { currentBaseFee, currentTrend } = useGasTrends({
    inputAsset,
    gasData,
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

  const updateCustomMaxBaseFee = (baseFee: string, warning: 'fail' | 'stuck' | undefined) => {
    'worklet';

    if (selectedGasSpeed.value !== GasSpeed.CUSTOM) {
      const gasForSelectedSpeed = gasFeeParamsBySpeed.value?.[selectedGasSpeed.value] as GasFeeParams;
      if (gasForSelectedSpeed) {
        selectedGas.value = gasForSelectedSpeed;
        maxPriorityFee.value = gasForSelectedSpeed.maxBaseFee.gwei;
      }
    }

    selectedGasSpeed.value = GasSpeed.CUSTOM;
    maxBaseFee.value = baseFee;
    maxBaseFeeWarning.value = warning;
  };

  const updateCustomMaxPriorityFee = (priorityFee: string, warning: 'fail' | 'stuck' | undefined) => {
    'worklet';

    if (SwapSettings.flashbots.value && Number(priorityFee) < 6) {
      return;
    }

    if (selectedGasSpeed.value !== GasSpeed.CUSTOM) {
      const prevSelectedGas = gasFeeParamsBySpeed.value?.[selectedGasSpeed.value] as GasFeeParams;
      if (prevSelectedGas) {
        selectedGas.value = prevSelectedGas;
        runOnJS(gasStore.setState)({
          selectedGas: prevSelectedGas,
        });

        maxBaseFee.value = prevSelectedGas.maxBaseFee.gwei;
      }
    }

    selectedGasSpeed.value = GasSpeed.CUSTOM;
    maxPriorityFee.value = priorityFee;
    maxPriorityFeeWarning.value = warning;
  };

  return {
    // meteorology data
    gasData,

    // gas trends
    currentBaseFee,
    currentTrend,

    // gas settings
    selectedGasSpeed,
    selectedGas,
    gasFeeParamsBySpeed,

    // custom gas settings
    maxBaseFee,
    maxBaseFeeWarning,
    maxPriorityFee,
    maxPriorityFeeWarning,

    // setters
    setSelectedGasSpeed,
    updateCustomMaxBaseFee,
    updateCustomMaxPriorityFee,

    // intervals
    gasDataInterval,
    estimatedGasLimitInterval,
    optimismFeeInterval,
  };
};
