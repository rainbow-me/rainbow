import c from 'chroma-js';
import { useMemo } from 'react';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

import { globalColors, useColorMode } from '@/design-system';

import {
  BASE_INPUT_HEIGHT,
  ETH_COLOR_DARK,
  ETH_COLOR_DARK_ACCENT,
  EXPANDED_INPUT_HEIGHT,
  FOCUSED_INPUT_HEIGHT,
  fadeConfig,
  springConfig,
} from '../constants';
import { opacity } from '../utils/swaps';

export const useSwapInputStyles = ({
  bottomInput,
  color,
  otherInputProgress,
  progress,
}: {
  bottomInput: boolean | undefined;
  color: string;
  otherInputProgress: Animated.SharedValue<number>;
  progress: Animated.SharedValue<number>;
}) => {
  const { isDarkMode } = useColorMode();

  const { bgColor, expandedBgColor, strokeColor, expandedStrokeColor, mixedShadowColor } = useMemo(() => {
    const bgColor = isDarkMode ? opacity(color, 0.08) : opacity(globalColors.white100, 0.8);
    const expandedBgColor = isDarkMode ? bgColor : opacity(globalColors.white100, 0.8);
    const strokeColor = isDarkMode ? opacity(color === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : color, 0.06) : globalColors.white100;
    const expandedStrokeColor = isDarkMode ? opacity(color, 0.1) : globalColors.white100;
    const mixedShadowColor = isDarkMode ? 'transparent' : c.mix(color, globalColors.grey100, 0.84).hex();

    return {
      bgColor,
      expandedBgColor,
      strokeColor,
      expandedStrokeColor,
      mixedShadowColor,
    };
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
      backgroundColor: withTiming(interpolateColor(progress.value, [0, 1], [bgColor, expandedBgColor]), fadeConfig),
      borderColor: withTiming(interpolateColor(progress.value, [0, 1], [strokeColor, expandedStrokeColor]), fadeConfig),
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
