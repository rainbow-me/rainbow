/* eslint-disable no-nested-ternary */
import { SharedValue, interpolate, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { globalColors, useColorMode } from '@/design-system';
import {
  BASE_INPUT_HEIGHT,
  EXPANDED_INPUT_HEIGHT,
  FOCUSED_INPUT_HEIGHT,
  THICK_BORDER_WIDTH,
  fadeConfig,
  springConfig,
} from '@/__swaps__/screens/Swap/constants';
import { getColorValueForThemeWorklet, opacityWorklet } from '@/__swaps__/utils/swaps';
import { SwapWarningType, useSwapWarning } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { spinnerExitConfig } from '@/components/animations/AnimatedSpinner';
import { NavigationSteps } from './useSwapNavigation';
import { IS_ANDROID } from '@/env';
import { safeAreaInsetValues } from '@/utils';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';

export function useAnimatedSwapStyles({
  SwapWarning,
  internalSelectedInputAsset,
  internalSelectedOutputAsset,
  inputProgress,
  outputProgress,
  reviewProgress,
  isFetching,
}: {
  SwapWarning: ReturnType<typeof useSwapWarning>;
  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  reviewProgress: SharedValue<number>;
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

  const hideWhenInputsExpandedOrNoPriceImpact = useAnimatedStyle(() => {
    return {
      opacity:
        SwapWarning.swapWarning.value.type === SwapWarningType.none || inputProgress.value > 0 || outputProgress.value > 0
          ? withTiming(0, fadeConfig)
          : withTiming(1, fadeConfig),
      pointerEvents:
        SwapWarning.swapWarning.value.type === SwapWarningType.none || inputProgress.value > 0 || outputProgress.value > 0
          ? 'none'
          : 'auto',
    };
  });

  const hideWhenInputsExpandedOrPriceImpact = useAnimatedStyle(() => {
    return {
      opacity:
        SwapWarning.swapWarning.value.type !== SwapWarningType.none || inputProgress.value > 0 || outputProgress.value > 0
          ? withTiming(0, fadeConfig)
          : withTiming(1, fadeConfig),
      pointerEvents:
        SwapWarning.swapWarning.value.type !== SwapWarningType.none || inputProgress.value > 0 || outputProgress.value > 0
          ? 'none'
          : 'auto',
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
      position: reviewProgress.value === NavigationSteps.SHOW_REVIEW ? 'absolute' : 'relative',
      bottom: reviewProgress.value === NavigationSteps.SHOW_REVIEW ? 0 : undefined,
      height: withSpring(
        reviewProgress.value === NavigationSteps.SHOW_REVIEW ? 407.68 + safeAreaInsetValues.bottom + 16 : 114,
        springConfig
      ),
      borderTopLeftRadius: reviewProgress.value === NavigationSteps.SHOW_REVIEW ? (IS_ANDROID ? 20 : 40) : 0,
      borderTopRightRadius: reviewProgress.value === NavigationSteps.SHOW_REVIEW ? (IS_ANDROID ? 20 : 40) : 0,
      borderWidth: reviewProgress.value === NavigationSteps.SHOW_REVIEW ? THICK_BORDER_WIDTH : 0,
      borderColor: reviewProgress.value === NavigationSteps.SHOW_REVIEW ? opacityWorklet(globalColors.darkGrey, 0.2) : undefined,
      backgroundColor:
        reviewProgress.value === NavigationSteps.SHOW_REVIEW
          ? isDarkMode
            ? '#191A1C'
            : globalColors.white100
          : opacityWorklet(getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.color, isDarkMode, true), 0.03),
      borderTopColor:
        reviewProgress.value === NavigationSteps.SHOW_REVIEW
          ? opacityWorklet(globalColors.darkGrey, 0.2)
          : opacityWorklet(getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.color, isDarkMode, true), 0.04),
      paddingTop: reviewProgress.value === NavigationSteps.SHOW_REVIEW ? 28 : 16 - THICK_BORDER_WIDTH,
    };
  });

  const assetToSellIconStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true),
    };
  });

  const assetToSellCaretStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true),
    };
  });

  const assetToBuyIconStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.color, isDarkMode, true),
    };
  });

  const assetToBuyCaretStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.color, isDarkMode, true),
    };
  });

  const flipButtonFetchingStyle = useAnimatedStyle(() => {
    return {
      borderWidth: isFetching ? withTiming(2, { duration: 300 }) : withTiming(THICK_BORDER_WIDTH, spinnerExitConfig),
    };
  });

  const searchInputAssetButtonStyle = useAnimatedStyle(() => {
    return {
      color: getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true),
    };
  });

  const searchOutputAssetButtonStyle = useAnimatedStyle(() => {
    return {
      color: getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.color, isDarkMode, true),
    };
  });

  const hideWhileReviewing = useAnimatedStyle(() => {
    return {
      opacity: reviewProgress.value === NavigationSteps.SHOW_REVIEW ? withTiming(0, fadeConfig) : withTiming(1, fadeConfig),
      pointerEvents: reviewProgress.value === NavigationSteps.SHOW_REVIEW ? 'none' : 'auto',
    };
  });

  const searchInputAssetButtonWrapperStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(
        getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true),
        isDarkMode ? 0.1 : 0.08
      ),
      borderColor: opacityWorklet(
        getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true),
        isDarkMode ? 0.06 : 0.01
      ),
      borderWidth: THICK_BORDER_WIDTH,
    };
  });

  const searchOutputAssetButtonWrapperStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(
        getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.color, isDarkMode, true),
        isDarkMode ? 0.1 : 0.08
      ),
      borderColor: opacityWorklet(
        getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.color, isDarkMode, true),
        isDarkMode ? 0.06 : 0.01
      ),
      borderWidth: THICK_BORDER_WIDTH,
    };
  });

  return {
    flipButtonStyle,
    focusedSearchStyle,
    hideWhenInputsExpandedOrPriceImpact,
    hideWhenInputsExpandedOrNoPriceImpact,
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
    hideWhileReviewing,
    flipButtonFetchingStyle,
    searchInputAssetButtonStyle,
    searchOutputAssetButtonStyle,
    searchInputAssetButtonWrapperStyle,
    searchOutputAssetButtonWrapperStyle,
  };
}
