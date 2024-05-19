import { useCallback } from 'react';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';

import { SharedValue, runOnJS, useSharedValue } from 'react-native-reanimated';
import { swapsStore } from '@/state/swaps/swapsStore';
import { SlippageStep } from '../constants';
import { getDefaultSlippageWorklet } from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';
import { DEFAULT_CONFIG } from '@/model/remoteConfig';

export const useSwapSettings = ({ inputAsset }: { inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null> }) => {
  const flashbots = useSharedValue(false);
  const slippage = useSharedValue(getDefaultSlippageWorklet(inputAsset.value?.chainId ?? ChainId.mainnet, DEFAULT_CONFIG));

  const onToggleFlashbots = () => {
    'worklet';

    const current = flashbots.value;
    flashbots.value = !current;
    runOnJS(swapsStore.setState)({
      flashbots: !current,
    });
  };

  const onUpdateSlippage = useCallback(
    (operation: 'plus' | 'minus') => {
      'worklet';

      const value = Number(slippage.value) + (operation === 'plus' ? SlippageStep : -SlippageStep);

      // if we're trying to decrement below the minimum, set to the minimum
      if (Number(slippage.value) + value <= SlippageStep) {
        slippage.value = SlippageStep.toString();
      } else {
        slippage.value = (Number(slippage.value) + value).toString();
      }

      runOnJS(swapsStore.setState)({
        slippage: slippage.value,
      });
    },
    [slippage]
  );

  return {
    flashbots,
    slippage,

    onToggleFlashbots,
    onUpdateSlippage,
  };
};
