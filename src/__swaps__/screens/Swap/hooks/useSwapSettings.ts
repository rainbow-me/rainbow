import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';

import { SharedValue, runOnJS, useSharedValue } from 'react-native-reanimated';
import { swapsStore } from '@/state/swaps/swapsStore';
import { slippageStep } from '@/__swaps__/screens/Swap/constants';
import { getDefaultSlippageWorklet } from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';
import { DEFAULT_CONFIG } from '@/model/remoteConfig';
import { useCallback } from 'react';
import { analyticsV2 } from '@/analytics';

export const useSwapSettings = ({ inputAsset }: { inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null> }) => {
  const flashbots = useSharedValue(swapsStore.getState().flashbots);
  const slippage = useSharedValue(getDefaultSlippageWorklet(inputAsset.value?.chainId ?? ChainId.mainnet, DEFAULT_CONFIG));

  const setSlippage = swapsStore(state => state.setSlippage);
  const setFlashbots = swapsStore(state => state.setFlashbots);

  const onToggleFlashbots = () => {
    'worklet';

    const current = flashbots.value;
    flashbots.value = !current;
    runOnJS(setFlashbots)(!current);
  };

  const handleTrackAndUpdateSlippage = useCallback(
    (value: string) => {
      const { inputAsset, outputAsset, quote } = swapsStore.getState();

      setSlippage(value);

      analyticsV2.track(analyticsV2.event.swapsChangedMaximumSlippage, {
        slippage: value,
        inputAsset,
        outputAsset,
        quote,
      });
    },
    [setSlippage]
  );

  const onUpdateSlippage = (operation: 'plus' | 'minus') => {
    'worklet';

    const value = operation === 'plus' ? slippageStep : -slippageStep;

    // if we're trying to decrement below the minimum, set to the minimum
    if (Number(slippage.value) + value <= slippageStep) {
      slippage.value = slippageStep.toFixed(1).toString();
    } else {
      slippage.value = (Number(slippage.value) + value).toFixed(1).toString();
    }

    runOnJS(handleTrackAndUpdateSlippage)(slippage.value);
  };

  return {
    flashbots,
    slippage,

    onToggleFlashbots,
    onUpdateSlippage,
  };
};
