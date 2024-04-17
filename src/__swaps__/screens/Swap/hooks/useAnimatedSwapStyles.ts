import { SharedValue, interpolate, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useColorMode } from '@/design-system';
import {
  BASE_INPUT_HEIGHT,
  EXPANDED_INPUT_HEIGHT,
  FOCUSED_INPUT_HEIGHT,
  THICK_BORDER_WIDTH,
  fadeConfig,
  springConfig,
} from '@/__swaps__/screens/Swap/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';
import { SwapPriceImpactType, usePriceImpactWarning } from '@/__swaps__/screens/Swap/hooks/usePriceImpactWarning';
import { spinnerExitConfig } from '@/__swaps__/components/animations/AnimatedSpinner';

export function useAnimatedSwapStyles({
  SwapInputController,
  PriceImpactWarning,
  inputProgress,
  outputProgress,
  isFetching,
}: {
  SwapInputController: ReturnType<typeof useSwapInputsController>;
  PriceImpactWarning: ReturnType<typeof usePriceImpactWarning>;
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  isFetching: SharedValue<boolean>;
}) {
  const { isDarkMode } = useColorMode();

  const flipButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(
            interpolate(inputProgress.value, [0, 1, 2], [0, 0, EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT], 'clamp'),
            springConfig
          ),
        },
      ],
    };
  });

  const focusedSearchStyle = useAnimatedStyle(() => {
    return {
      opacity: inputProgress.value === 2 || outputProgress.value === 2 ? withTiming(0, fadeConfig) : withTiming(1, fadeConfig),
      pointerEvents: inputProgress.value === 2 || outputProgress.value === 2 ? 'none' : 'auto',
    };
  });

  const hideWhenPriceWarningIsNotPresent = useAnimatedStyle(() => {
    return {
      opacity: PriceImpactWarning.value?.type === SwapPriceImpactType.none ? withTiming(0, fadeConfig) : withTiming(1, fadeConfig),
      pointerEvents: PriceImpactWarning.value?.type === SwapPriceImpactType.none ? 'none' : 'auto',
    };
  });

  const hideWhenPriceImpactWarningIsPresent = useAnimatedStyle(() => {
    return {
      opacity: PriceImpactWarning.value?.type !== SwapPriceImpactType.none ? withTiming(0, fadeConfig) : withTiming(1, fadeConfig),
      pointerEvents: PriceImpactWarning.value?.type !== SwapPriceImpactType.none ? 'none' : 'auto',
    };
  });

  const hideWhenInputsExpanded = useAnimatedStyle(() => {
    return {
      opacity: inputProgress.value > 0 || outputProgress.value > 0 ? withTiming(0, fadeConfig) : withTiming(1, fadeConfig),
      pointerEvents: inputProgress.value > 0 || outputProgress.value > 0 ? 'none' : 'auto',
    };
  });

  const inputStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(inputProgress.value, [0, 1], [1, 0], 'clamp'), fadeConfig),
      pointerEvents: inputProgress.value === 0 ? 'auto' : 'none',
    };
  });

  const inputTokenListStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(inputProgress.value, [0, 1], [0, 1], 'clamp'), fadeConfig),
      pointerEvents: inputProgress.value === 0 ? 'none' : 'auto',
    };
  });

  const keyboardStyle = useAnimatedStyle(() => {
    const progress = Math.min(inputProgress.value + outputProgress.value, 1);

    return {
      opacity: withTiming(1 - progress, fadeConfig),
      transform: [
        {
          translateY: withSpring(progress * (EXPANDED_INPUT_HEIGHT - BASE_INPUT_HEIGHT), springConfig),
        },
        { scale: withSpring(0.925 + (1 - progress) * 0.075, springConfig) },
      ],
    };
  });

  const outputStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(outputProgress.value, [0, 1], [1, 0], 'clamp'), fadeConfig),
      pointerEvents: outputProgress.value === 0 ? 'auto' : 'none',
    };
  });

  const outputTokenListStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(outputProgress.value, [0, 1], [0, 1], 'clamp'), fadeConfig),
      pointerEvents: outputProgress.value === 0 ? 'none' : 'auto',
    };
  });

  const swapActionWrapperStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(SwapInputController.bottomColor.value, 0.03),
      borderTopColor: opacityWorklet(SwapInputController.bottomColor.value, 0.04),
      borderTopWidth: THICK_BORDER_WIDTH,
    };
  });

  const assetToSellIconStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: SwapInputController.topColor.value,
    };
  });

  const assetToSellCaretStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: SwapInputController.topColor.value,
    };
  });

  const assetToBuyIconStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: SwapInputController.bottomColor.value,
    };
  });

  const assetToBuyCaretStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: SwapInputController.bottomColor.value,
    };
  });

  const flipButtonFetchingStyle = useAnimatedStyle(() => {
    return {
      borderWidth: isFetching ? withTiming(2, { duration: 300 }) : withTiming(THICK_BORDER_WIDTH, spinnerExitConfig),
    };
  });

  const searchInputAssetButtonStyle = useAnimatedStyle(() => {
    return {
      color: SwapInputController.topColor.value,
    };
  });

  const searchOutputAssetButtonStyle = useAnimatedStyle(() => {
    return {
      color: SwapInputController.bottomColor.value,
    };
  });

  const searchInputAssetButtonWrapperStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(SwapInputController.topColor.value, isDarkMode ? 0.1 : 0.08),
      borderColor: opacityWorklet(SwapInputController.topColor.value, isDarkMode ? 0.06 : 0.01),
      borderWidth: THICK_BORDER_WIDTH,
    };
  });

  const searchOutputAssetButtonWrapperStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(SwapInputController.bottomColor.value, isDarkMode ? 0.1 : 0.08),
      borderColor: opacityWorklet(SwapInputController.bottomColor.value, isDarkMode ? 0.06 : 0.01),
      borderWidth: THICK_BORDER_WIDTH,
    };
  });

  return {
    flipButtonStyle,
    focusedSearchStyle,
    hideWhenInputsExpanded,
    hideWhenPriceImpactWarningIsPresent,
    hideWhenPriceWarningIsNotPresent,
    inputStyle,
    inputTokenListStyle,
    keyboardStyle,
    outputStyle,
    outputTokenListStyle,
    swapActionWrapperStyle,
    assetToSellIconStyle,
    assetToSellCaretStyle,
    assetToBuyIconStyle,
    assetToBuyCaretStyle,
    flipButtonFetchingStyle,
    searchInputAssetButtonStyle,
    searchOutputAssetButtonStyle,
    searchInputAssetButtonWrapperStyle,
    searchOutputAssetButtonWrapperStyle,
  };
}
