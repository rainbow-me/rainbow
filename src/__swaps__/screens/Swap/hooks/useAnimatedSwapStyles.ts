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
  fadeConfig,
  springConfig,
} from '@/__swaps__/screens/Swap/constants';
import { SwapWarningType, useSwapWarning } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { getColorValueForThemeWorklet, opacityWorklet } from '@/__swaps__/utils/swaps';
import { spinnerExitConfig } from '@/components/animations/AnimatedSpinner';
import { globalColors, useColorMode } from '@/design-system';
import { foregroundColors } from '@/design-system/color/palettes';
import { IS_ANDROID } from '@/env';
import { safeAreaInsetValues } from '@/utils';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { SharedValue, interpolate, useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';
import { NavigationSteps } from './useSwapNavigation';
import { ChainId } from '@/__swaps__/types/chains';

const INSET_BOTTOM = IS_ANDROID ? getSoftMenuBarHeight() - 24 : safeAreaInsetValues.bottom + 16;
const HEIGHT_FOR_PANEL: { [key in NavigationSteps]: number } = {
  [NavigationSteps.INPUT_ELEMENT_FOCUSED]: BOTTOM_ACTION_BAR_HEIGHT,
  [NavigationSteps.SEARCH_FOCUSED]: BOTTOM_ACTION_BAR_HEIGHT,
  [NavigationSteps.TOKEN_LIST_FOCUSED]: BOTTOM_ACTION_BAR_HEIGHT,
  [NavigationSteps.SHOW_REVIEW]: REVIEW_SHEET_HEIGHT + INSET_BOTTOM,
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

  const hideWhenInputsExpanded = useAnimatedStyle(() => {
    return {
      opacity: inputProgress.value > 0 || outputProgress.value > 0 ? withTiming(0, fadeConfig) : withTiming(1, fadeConfig),
      pointerEvents: inputProgress.value > 0 || outputProgress.value > 0 ? 'none' : 'auto',
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
    const isReviewing = configProgress.value === NavigationSteps.SHOW_REVIEW;
    const isReviewingOrConfiguringGas = isReviewing || configProgress.value === NavigationSteps.SHOW_GAS;

    let heightForCurrentSheet = HEIGHT_FOR_PANEL[configProgress.value];
    if (isReviewing && (internalSelectedInputAsset.value?.chainId ?? ChainId.mainnet) !== ChainId.mainnet) {
      // Remove height when the Flashbots row in the review sheet is hidden
      heightForCurrentSheet -= REVIEW_SHEET_ROW_HEIGHT + REVIEW_SHEET_ROW_GAP;
    }

    return {
      position: isReviewingOrConfiguringGas ? 'absolute' : 'relative',
      bottom: isReviewingOrConfiguringGas ? 0 : undefined,
      height: withSpring(heightForCurrentSheet, springConfig),
      borderTopLeftRadius: isReviewingOrConfiguringGas ? (IS_ANDROID ? 20 : 40) : 0,
      borderTopRightRadius: isReviewingOrConfiguringGas ? (IS_ANDROID ? 20 : 40) : 0,
      borderWidth: isReviewingOrConfiguringGas ? THICK_BORDER_WIDTH : 0,
      borderColor: isReviewingOrConfiguringGas ? opacityWorklet(globalColors.darkGrey, 0.2) : undefined,
      backgroundColor: opacityWorklet(
        getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.highContrastColor, isDarkMode, true),
        0.03
      ),
      borderTopColor: isReviewingOrConfiguringGas
        ? opacityWorklet(globalColors.darkGrey, 0.2)
        : opacityWorklet(getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.highContrastColor, isDarkMode, true), 0.04),
      paddingTop: isReviewingOrConfiguringGas ? 28 : 16 - THICK_BORDER_WIDTH,
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
          ? withTiming(0, fadeConfig)
          : withTiming(1, fadeConfig),
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
      borderWidth: THICK_BORDER_WIDTH,
    };
  });

  const searchOutputAssetButtonWrapperStyle = useAnimatedStyle(() => {
    const color = isPasteMode.value ? foregroundColors.blue : internalSelectedOutputAsset.value?.highContrastColor;

    return {
      backgroundColor: opacityWorklet(getColorValueForThemeWorklet(color, isDarkMode, true), isDarkMode ? 0.1 : 0.08),
      borderColor: opacityWorklet(getColorValueForThemeWorklet(color, isDarkMode, true), isDarkMode ? 0.06 : 0.01),
      borderWidth: isPasteMode.value ? 0 : THICK_BORDER_WIDTH,
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
