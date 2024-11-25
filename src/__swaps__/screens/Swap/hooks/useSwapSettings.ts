import { slippageStep } from '@/__swaps__/screens/Swap/constants';
import { analyticsV2 } from '@/analytics';
import { swapsStore } from '@/state/swaps/swapsStore';
import { runOnJS, SharedValue, useSharedValue } from 'react-native-reanimated';

export const useSwapSettings = ({ debouncedFetchQuote, slippage }: { debouncedFetchQuote: () => void; slippage: SharedValue<string> }) => {
  const degenMode = useSharedValue(swapsStore.getState().degenMode);

  const setSlippage = swapsStore(state => state.setSlippage);

  const setDegenMode = (value: boolean) => {
    swapsStore.getState().setDegenMode(value);
    analyticsV2.track(analyticsV2.event.swapsToggledDegenMode, { enabled: value });
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
    slippage,
    degenMode,
    onUpdateSlippage,
    onToggleDegenMode,
  };
};
