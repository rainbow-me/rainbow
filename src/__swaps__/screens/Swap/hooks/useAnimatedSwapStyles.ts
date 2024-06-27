/* eslint-disable no-nested-ternary */
import {
  BASE_INPUT_HEIGHT,
  BOTTOM_ACTION_BAR_HEIGHT,
  EXPANDED_INPUT_HEIGHT,
  FOCUSED_INPUT_HEIGHT,
  GAS_SHEET_HEIGHT,
  REVIEW_SHEET_HEIGHT,
  REVIEW_SHEET_ROW_GAP,
  REVIEW_SHEET_ROW_HEIGHT,
  THICK_BORDER_WIDTH,
} from '@/__swaps__/screens/Swap/constants';
import { SwapWarningType, useSwapWarning } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { getColorValueForThemeWorklet, opacityWorklet } from '@/__swaps__/utils/swaps';
import { spinnerExitConfig } from '@/components/animations/AnimatedSpinner';
import { useColorMode } from '@/design-system';
import { foregroundColors } from '@/design-system/color/palettes';
import { IS_ANDROID } from '@/env';
import { safeAreaInsetValues } from '@/utils';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { SharedValue, interpolate, useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';
import { NavigationSteps } from './useSwapNavigation';
import { ChainId } from '@/__swaps__/types/chains';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';

const INSET_BOTTOM = IS_ANDROID ? getSoftMenuBarHeight() - 24 : safeAreaInsetValues.bottom + 16;
const HEIGHT_FOR_PANEL: { [key in NavigationSteps]: number } = {
  [NavigationSteps.INPUT_ELEMENT_FOCUSED]: BOTTOM_ACTION_BAR_HEIGHT,
  [NavigationSteps.SEARCH_FOCUSED]: BOTTOM_ACTION_BAR_HEIGHT,
  [NavigationSteps.TOKEN_LIST_FOCUSED]: BOTTOM_ACTION_BAR_HEIGHT,
  [NavigationSteps.SHOW_REVIEW]: REVIEW_SHEET_HEIGHT,
  [NavigationSteps.SHOW_GAS]: GAS_SHEET_HEIGHT + INSET_BOTTOM,
};

export function useAnimatedSwapStyles({
  SwapWarning,
  internalSelectedInputAsset,
  internalSelectedOutputAsset,
  inputProgress,
  outputProgress,
  configProgress,
  isFetching,
}: {
  SwapWarning: ReturnType<typeof useSwapWarning>;
  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  configProgress: SharedValue<NavigationSteps>;
  isFetching: SharedValue<boolean>;
}) {
  const { isDarkMode } = useColorMode();

  const flipButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(
            interpolate(inputProgress.value, [0, 1, 2], [0, 0, EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT], 'clamp'),
            SPRING_CONFIGS.springConfig
          ),
        },
      ],
    };
  });

  const focusedSearchStyle = useAnimatedStyle(() => {
    return {
      opacity:
        inputProgress.value === 2 || outputProgress.value === 2
          ? withTiming(0, TIMING_CONFIGS.fadeConfig)
          : withTiming(1, TIMING_CONFIGS.fadeConfig),
      pointerEvents: inputProgress.value === 2 || outputProgress.value === 2 ? 'none' : 'auto',
    };
  });

  const hideWhenInputsExpandedOrNoPriceImpact = useAnimatedStyle(() => {
    return {
      opacity:
        SwapWarning.swapWarning.value.type === SwapWarningType.none || inputProgress.value > 0 || outputProgress.value > 0
          ? withTiming(0, TIMING_CONFIGS.fadeConfig)
          : withTiming(1, TIMING_CONFIGS.fadeConfig),
      pointerEvents:
        SwapWarning.swapWarning.value.type === SwapWarningType.none || inputProgress.value > 0 || outputProgress.value > 0
          ? 'none'
          : 'auto',
    };
  });

  const hideWhenInputsExpanded = useAnimatedStyle(() => {
    return {
      opacity:
        inputProgress.value > 0 || outputProgress.value > 0
          ? withTiming(0, TIMING_CONFIGS.fadeConfig)
          : withTiming(1, TIMING_CONFIGS.fadeConfig),
      pointerEvents: inputProgress.value > 0 || outputProgress.value > 0 ? 'none' : 'auto',
    };
  });

  const hideWhenInputsExpandedOrPriceImpact = useAnimatedStyle(() => {
    return {
      opacity:
        SwapWarning.swapWarning.value.type !== SwapWarningType.none || inputProgress.value > 0 || outputProgress.value > 0
          ? withTiming(0, TIMING_CONFIGS.fadeConfig)
          : withTiming(1, TIMING_CONFIGS.fadeConfig),
      pointerEvents:
        SwapWarning.swapWarning.value.type !== SwapWarningType.none || inputProgress.value > 0 || outputProgress.value > 0
          ? 'none'
          : 'auto',
    };
  });

  const inputStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(inputProgress.value, [0, 1], [1, 0], 'clamp'), TIMING_CONFIGS.fadeConfig),
      pointerEvents: inputProgress.value === 0 ? 'auto' : 'none',
    };
  });

  const inputTokenListStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(inputProgress.value, [0, 1], [0, 1], 'clamp'), TIMING_CONFIGS.fadeConfig),
      pointerEvents: inputProgress.value === 0 ? 'none' : 'auto',
    };
  });

  const keyboardStyle = useAnimatedStyle(() => {
    const progress = Math.min(inputProgress.value + outputProgress.value, 1);

    return {
      opacity: withTiming(1 - progress, TIMING_CONFIGS.fadeConfig),
      transform: [
        {
          translateY: withSpring(progress * (EXPANDED_INPUT_HEIGHT - BASE_INPUT_HEIGHT), SPRING_CONFIGS.springConfig),
        },
        { scale: withSpring(0.925 + (1 - progress) * 0.075, SPRING_CONFIGS.springConfig) },
      ],
    };
  });

  const outputStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(outputProgress.value, [0, 1], [1, 0], 'clamp'), TIMING_CONFIGS.fadeConfig),
      pointerEvents: outputProgress.value === 0 ? 'auto' : 'none',
    };
  });

  const outputTokenListStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(outputProgress.value, [0, 1], [0, 1], 'clamp'), TIMING_CONFIGS.fadeConfig),
      pointerEvents: outputProgress.value === 0 ? 'none' : 'auto',
    };
  });

  const outputAssetColor = useDerivedValue(() => {
    return getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.highContrastColor, isDarkMode, true);
  });

  const swapActionWrapperStyle = useAnimatedStyle(() => {
    const isReviewing = configProgress.value === NavigationSteps.SHOW_REVIEW;
    const isReviewingOrConfiguringGas = isReviewing || configProgress.value === NavigationSteps.SHOW_GAS;

    let heightForCurrentSheet = HEIGHT_FOR_PANEL[configProgress.value];
    if (isReviewing && (internalSelectedInputAsset.value?.chainId ?? ChainId.mainnet) !== ChainId.mainnet) {
      // Remove height when the Flashbots row in the review sheet is hidden
      heightForCurrentSheet -= REVIEW_SHEET_ROW_HEIGHT + REVIEW_SHEET_ROW_GAP;
    }

    return {
      backgroundColor: opacityWorklet(outputAssetColor.value, 0.06),
      borderColor: withSpring(
        configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS
          ? opacityWorklet(outputAssetColor.value, 0.2)
          : opacityWorklet(outputAssetColor.value, 0.06),
        SPRING_CONFIGS.springConfig
      ),
      borderRadius: withSpring(isReviewingOrConfiguringGas ? 40 : 0, SPRING_CONFIGS.springConfig),
      bottom: withSpring(isReviewingOrConfiguringGas ? Math.max(safeAreaInsetValues.bottom, 28) : -2, SPRING_CONFIGS.springConfig),
      height: withSpring(heightForCurrentSheet, SPRING_CONFIGS.springConfig),
      left: withSpring(isReviewingOrConfiguringGas ? 12 : -2, SPRING_CONFIGS.springConfig),
      right: withSpring(isReviewingOrConfiguringGas ? 12 : -2, SPRING_CONFIGS.springConfig),
      paddingHorizontal: withSpring((isReviewingOrConfiguringGas ? 16 : 18) - THICK_BORDER_WIDTH, SPRING_CONFIGS.springConfig),
      paddingTop: withSpring((isReviewingOrConfiguringGas ? 28 : 16) - THICK_BORDER_WIDTH, SPRING_CONFIGS.springConfig),
    };
  });

  const assetToSellIconStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true),
    };
  });

  const assetToBuyIconStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.color, isDarkMode, true),
    };
  });

  const assetToSellCaretStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode, true),
    };
  });

  const assetToBuyCaretStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.highContrastColor, isDarkMode, true),
    };
  });

  const flipButtonFetchingStyle = useAnimatedStyle(() => {
    if (IS_ANDROID) return { borderWidth: 0 };
    return {
      borderWidth: isFetching.value ? withTiming(2, { duration: 300 }) : withTiming(THICK_BORDER_WIDTH, spinnerExitConfig),
    };
  });

  const searchInputAssetButtonStyle = useAnimatedStyle(() => {
    return {
      color: getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode, true),
    };
  });

  const isPasteMode = useDerivedValue(
    () => outputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED && !internalSelectedOutputAsset.value
  );

  const searchOutputAssetButtonStyle = useAnimatedStyle(() => {
    const color = isPasteMode.value ? foregroundColors.blue : internalSelectedOutputAsset.value?.highContrastColor;

    return {
      color: getColorValueForThemeWorklet(color, isDarkMode, true),
    };
  });

  const hideWhileReviewingOrConfiguringGas = useAnimatedStyle(() => {
    return {
      opacity:
        configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS
          ? withTiming(0, TIMING_CONFIGS.fadeConfig)
          : withTiming(1, TIMING_CONFIGS.fadeConfig),
      pointerEvents:
        configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS ? 'none' : 'auto',
    };
  });

  const searchInputAssetButtonWrapperStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(
        getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode, true),
        isDarkMode ? 0.1 : 0.08
      ),
      borderColor: opacityWorklet(
        getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode, true),
        isDarkMode ? 0.06 : 0.01
      ),
    };
  });

  const searchOutputAssetButtonWrapperStyle = useAnimatedStyle(() => {
    const color = isPasteMode.value ? foregroundColors.blue : internalSelectedOutputAsset.value?.highContrastColor;

    const darkModeBorderOpacity = isPasteMode.value ? 0.08 : 0.06;
    const lightModeBorderOpacity = isPasteMode.value ? 0.06 : 0.01;

    return {
      backgroundColor: isPasteMode.value
        ? 'transparent'
        : opacityWorklet(getColorValueForThemeWorklet(color, isDarkMode, true), isDarkMode ? 0.1 : 0.08),
      borderColor: opacityWorklet(
        getColorValueForThemeWorklet(color, isDarkMode, true),
        isDarkMode ? darkModeBorderOpacity : lightModeBorderOpacity
      ),
    };
  });

  return {
    flipButtonStyle,
    focusedSearchStyle,
    hideWhenInputsExpanded,
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
    hideWhileReviewingOrConfiguringGas,
    flipButtonFetchingStyle,
    searchInputAssetButtonStyle,
    searchOutputAssetButtonStyle,
    searchInputAssetButtonWrapperStyle,
    searchOutputAssetButtonWrapperStyle,
  };
}
