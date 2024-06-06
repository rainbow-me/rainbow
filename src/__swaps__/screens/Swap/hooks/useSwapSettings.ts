import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';

import { SharedValue, runOnJS, useSharedValue } from 'react-native-reanimated';
import { swapsStore } from '@/state/swaps/swapsStore';
import { slippageStep } from '@/__swaps__/screens/Swap/constants';
import { getDefaultSlippageWorklet } from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';
import { getRemoteConfig } from '@/model/remoteConfig';

export const useSwapSettings = ({ inputAsset }: { inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null> }) => {
  const remoteConfig = getRemoteConfig();

  const flashbots = useSharedValue(swapsStore.getState().flashbots);
  const slippage = useSharedValue(swapsStore.getState().slippage);

  const setSlippage = swapsStore(state => state.setSlippage);
  const setFlashbots = swapsStore(state => state.setFlashbots);

  const onToggleFlashbots = () => {
    'worklet';

    const current = flashbots.value;
    flashbots.value = !current;
    runOnJS(setFlashbots)(!current);
  };

  const onUpdateSlippage = (operation: 'plus' | 'minus') => {
    'worklet';

    const value = operation === 'plus' ? slippageStep : -slippageStep;

    // if we're trying to decrement below the minimum, set to the minimum
    if (Number(slippage.value) + value <= slippageStep) {
      slippage.value = slippageStep.toFixed(1).toString();
    } else {
      slippage.value = (Number(slippage.value) + value).toFixed(1).toString();
    }

    runOnJS(setSlippage)(slippage.value);
  };

  return {
    flashbots,
    slippage,

    onToggleFlashbots,
    onUpdateSlippage,
  };
};
