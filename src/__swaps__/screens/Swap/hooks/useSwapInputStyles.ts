import Animated, {
  SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { globalColors, useColorMode } from '@/design-system';

import { NavigationSteps } from './useSwapNavigation';
import {
  BASE_INPUT_HEIGHT,
  ETH_COLOR_DARK,
  ETH_COLOR_DARK_ACCENT,
  EXPANDED_INPUT_HEIGHT,
  FOCUSED_INPUT_HEIGHT,
  fadeConfig,
  springConfig,
} from '@/__swaps__/screens/Swap/constants';
import { getColorValueForThemeWorklet, opacityWorklet } from '@/__swaps__/utils/swaps';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';

export const useSwapInputStyles = ({
  asset,
  bottomInput,
  otherInputProgress,
  progress,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  bottomInput: boolean | undefined;
  otherInputProgress: Animated.SharedValue<number>;
  progress: Animated.SharedValue<number>;
}) => {
  const { isDarkMode } = useColorMode();

  const bgColor = useDerivedValue(() => {
    return isDarkMode
      ? opacityWorklet(getColorValueForThemeWorklet(asset.value?.color, isDarkMode, true), 0.08)
      : opacityWorklet(globalColors.white100, 0.8);
  });

  const expandedBgColor = useDerivedValue(() => {
    return isDarkMode ? bgColor.value : opacityWorklet(globalColors.white100, 0.8);
  });

  const strokeColor = useDerivedValue(() => {
    return isDarkMode
      ? opacityWorklet(
          getColorValueForThemeWorklet(asset.value?.color, isDarkMode, true) === ETH_COLOR_DARK
            ? ETH_COLOR_DARK_ACCENT
            : getColorValueForThemeWorklet(asset.value?.color, isDarkMode, true),
          0.06
        )
      : globalColors.white100;
  });

  const expandedStrokeColor = useDerivedValue(() => {
    return isDarkMode ? opacityWorklet(getColorValueForThemeWorklet(asset.value?.color, isDarkMode, true), 0.1) : globalColors.white100;
  });

  const containerStyle = useAnimatedStyle(() => {
    const getContainerStyleTranslateY = (progress: Animated.SharedValue<number>, bottomInput: boolean | undefined) => {
      if (progress.value === NavigationSteps.SEARCH_FOCUSED) {
        if (bottomInput) {
          return withSpring(-191, springConfig);
        } else {
          return withSpring(-77, springConfig);
        }
      }

      return withSpring(0, springConfig);
    };

    return {
      shadowColor: getColorValueForThemeWorklet(asset.value?.mixedShadowColor, isDarkMode, true),
      opacity: otherInputProgress.value === NavigationSteps.SEARCH_FOCUSED ? withTiming(0, fadeConfig) : withTiming(1, fadeConfig),
      transform: [
        {
          translateY: getContainerStyleTranslateY(progress, bottomInput),
        },
      ],
    };
  }, [bottomInput, otherInputProgress, progress]);

  const inputStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(interpolateColor(progress.value, [0, 1], [bgColor.value, expandedBgColor.value]), fadeConfig),
      borderColor: withTiming(interpolateColor(progress.value, [0, 1], [strokeColor.value, expandedStrokeColor.value]), fadeConfig),
      height: withSpring(
        interpolate(progress.value, [0, 1, 2], [BASE_INPUT_HEIGHT, EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT], 'clamp'),
        springConfig
      ),
      transform: [
        {
          translateY: bottomInput
            ? withSpring(
                interpolate(otherInputProgress.value, [0, 1, 2], [0, 0, EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT], 'clamp'),
                springConfig
              )
            : 0,
        },
      ],
    };
  }, [bottomInput, otherInputProgress, progress, bgColor, expandedBgColor, strokeColor, expandedStrokeColor]);

  return { containerStyle, inputStyle };
};
