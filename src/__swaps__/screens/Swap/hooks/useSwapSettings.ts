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

    const value = operation === 'plus' ? SlippageStep : -SlippageStep;

    // if we're trying to decrement below the minimum, set to the minimum
    if (Number(slippage.value) + value <= SlippageStep) {
      slippage.value = SlippageStep.toFixed(1).toString();
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
