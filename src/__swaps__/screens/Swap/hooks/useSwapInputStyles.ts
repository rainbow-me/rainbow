import c from 'chroma-js';
import { useMemo } from 'react';
import Animated, {
  DerivedValue,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { globalColors, useColorMode } from '@/design-system';

import {
  BASE_INPUT_HEIGHT,
  ETH_COLOR_DARK,
  ETH_COLOR_DARK_ACCENT,
  EXPANDED_INPUT_HEIGHT,
  FOCUSED_INPUT_HEIGHT,
  fadeConfig,
  springConfig,
} from '@/__swaps__/screens/Swap/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

export const useSwapInputStyles = ({
  bottomInput,
  color,
  otherInputProgress,
  progress,
}: {
  bottomInput: boolean | undefined;
  color: DerivedValue<string | number>;
  otherInputProgress: Animated.SharedValue<number>;
  progress: Animated.SharedValue<number>;
}) => {
  const { isDarkMode } = useColorMode();

  const bgColor = useDerivedValue(() => {
    return isDarkMode ? opacityWorklet(color.value.toString(), 0.08) : opacityWorklet(globalColors.white100, 0.8);
  }, [color, isDarkMode]);

  const expandedBgColor = useDerivedValue(() => {
    return isDarkMode ? bgColor.value : opacityWorklet(globalColors.white100, 0.8);
  }, [bgColor, isDarkMode]);

  const strokeColor = useDerivedValue(() => {
    return isDarkMode
      ? opacityWorklet(color.value === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : color.value.toString(), 0.06)
      : globalColors.white100;
  }, [color, isDarkMode]);

  const expandedStrokeColor = useDerivedValue(() => {
    return isDarkMode ? opacityWorklet(color.value.toString(), 0.1) : globalColors.white100;
  }, [color, isDarkMode]);

  const mixedShadowColor = useMemo(() => {
    return isDarkMode ? 'transparent' : c.mix(color.value.toString(), globalColors.grey100, 0.84).hex();
  }, [color, isDarkMode]);

  const containerStyle = useAnimatedStyle(() => {
    const getContainerStyleTranslateY = (progress: Animated.SharedValue<number>, bottomInput: boolean | undefined) => {
      if (progress.value === 2) {
        if (bottomInput) {
          return withSpring(-191, springConfig);
        } else {
          return withSpring(-77, springConfig);
        }
      }

      return withSpring(0, springConfig);
    };

    return {
      opacity: otherInputProgress.value === 2 ? withTiming(0, fadeConfig) : withTiming(1, fadeConfig),
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

  return { containerStyle, inputStyle, mixedShadowColor };
};
