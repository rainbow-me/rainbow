import { slippageStep } from '@/__swaps__/screens/Swap/constants';
import { swapsStore } from '@/state/swaps/swapsStore';
import { runOnJS, SharedValue, useSharedValue } from 'react-native-reanimated';

export const useSwapSettings = ({ debouncedFetchQuote, slippage }: { debouncedFetchQuote: () => void; slippage: SharedValue<string> }) => {
  const flashbots = useSharedValue(swapsStore.getState().flashbots);
  const degenMode = useSharedValue(swapsStore.getState().degenMode);

  const setSlippage = swapsStore(state => state.setSlippage);
  const setFlashbots = swapsStore(state => state.setFlashbots);
  const setDegenMode = swapsStore(state => state.setDegenMode);

  const onToggleFlashbots = () => {
    'worklet';

    const current = flashbots.value;
    flashbots.value = !current;
    runOnJS(setFlashbots)(!current);
  };

  const onUpdateSlippage = (operation: 'plus' | 'minus') => {
    'worklet';

    const increment = operation === 'plus' ? slippageStep : -slippageStep;
    const prevSlippage = Number(slippage.value);

    // if we're trying to decrement below the minimum, set to the minimum
    if (prevSlippage + increment <= slippageStep) {
      slippage.value = slippageStep.toFixed(1).toString();
    } else {
      slippage.value = (prevSlippage + increment).toFixed(1).toString();
    }

    if (prevSlippage !== Number(slippage.value)) {
      runOnJS(setSlippage)(slippage.value);
      runOnJS(debouncedFetchQuote)();
    }
  };

  const onToggleDegenMode = () => {
    'worklet';

    const current = degenMode.value;
    degenMode.value = !current;
    runOnJS(setDegenMode)(!current);
  };

  return {
    flashbots,
    slippage,
    degenMode,

    onToggleFlashbots,
    onUpdateSlippage,
    onToggleDegenMode,
  };
};
