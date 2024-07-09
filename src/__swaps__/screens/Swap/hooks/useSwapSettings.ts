import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';

import { slippageStep } from '@/__swaps__/screens/Swap/constants';
import { ChainId } from '@/__swaps__/types/chains';
import { getDefaultSlippageWorklet } from '@/__swaps__/utils/swaps';
import { getRemoteConfig } from '@/model/remoteConfig';
import { swapsStore } from '@/state/swaps/swapsStore';
import { SharedValue, runOnJS, useSharedValue } from 'react-native-reanimated';

export const useSwapSettings = ({ inputAsset }: { inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null> }) => {
  const flashbots = useSharedValue(swapsStore.getState().flashbots);
  const slippage = useSharedValue(getDefaultSlippageWorklet(inputAsset.value?.chainId || ChainId.mainnet, getRemoteConfig()));

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
