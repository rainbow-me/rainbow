import { BASE_INPUT_WIDTH, ETH_COLOR_DARK, ETH_COLOR_DARK_ACCENT, THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { getColorValueForThemeWorklet, opacityWorklet } from '@/__swaps__/utils/swaps';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, globalColors, useColorMode } from '@/design-system';
import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASE_INPUT_HEIGHT, EXPANDED_INPUT_HEIGHT } from './constants';
import { usePerpsDepositContext } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsDepositContext';

const INTERPOLATION_OUTPUT_RANGE = Object.freeze([0, 1]);

const useContainerStyles = ({ progress }: { progress: SharedValue<number> }) => {
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();

  const { minifiedAsset } = usePerpsDepositContext();

  const currentAssetColor = useDerivedValue(() => minifiedAsset.value?.highContrastColor);

  const bgColor = useDerivedValue(() => {
    return isDarkMode
      ? opacityWorklet(getColorValueForThemeWorklet(currentAssetColor.value, isDarkMode), 0.08)
      : opacityWorklet(globalColors.white100, 0.8);
  });

  const expandedBgColor = useDerivedValue(() => {
    return isDarkMode ? bgColor.value : opacityWorklet(globalColors.white100, 0.8);
  });

  const strokeColor = useDerivedValue(() => {
    const color = currentAssetColor.value;
    return isDarkMode
      ? opacityWorklet(
          getColorValueForThemeWorklet(color, isDarkMode) === ETH_COLOR_DARK
            ? ETH_COLOR_DARK_ACCENT
            : getColorValueForThemeWorklet(color, isDarkMode),
          0.06
        )
      : globalColors.white100;
  });

  const expandedStrokeColor = useDerivedValue(() => {
    return isDarkMode ? opacityWorklet(getColorValueForThemeWorklet(currentAssetColor.value, isDarkMode), 0.1) : globalColors.white100;
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      shadowColor: isDarkMode ? 'transparent' : getColorValueForThemeWorklet(currentAssetColor.value, isDarkMode),
    };
  });

  const inputStyle = useAnimatedStyle(() => {
    const currentProgress = progress.value;
    return {
      backgroundColor: withTiming(
        interpolateColor(currentProgress, INTERPOLATION_OUTPUT_RANGE, [bgColor.value, expandedBgColor.value]),
        TIMING_CONFIGS.fadeConfig
      ),
      borderColor: withTiming(
        interpolateColor(currentProgress, INTERPOLATION_OUTPUT_RANGE, [strokeColor.value, expandedStrokeColor.value]),
        TIMING_CONFIGS.fadeConfig
      ),
      height: withSpring(
        interpolate(currentProgress, INTERPOLATION_OUTPUT_RANGE, [BASE_INPUT_HEIGHT, EXPANDED_INPUT_HEIGHT]),
        SPRING_CONFIGS.springConfig
      ),
      // Make sure to push the view under this out of the screen.
      marginBottom: withSpring(
        interpolate(currentProgress, INTERPOLATION_OUTPUT_RANGE, [0, safeAreaInsets.bottom]),
        SPRING_CONFIGS.springConfig
      ),
    };
  });

  return { containerStyle, inputStyle };
};

export const PerpsInputContainer = ({ children, progress }: { children?: ReactNode; progress: SharedValue<number> }) => {
  const { containerStyle, inputStyle } = useContainerStyles({ progress });
  return (
    <Box as={Animated.View} style={[styles.staticInputContainerStyles, containerStyle]} width={{ custom: BASE_INPUT_WIDTH }}>
      <Box as={Animated.View} style={[styles.staticInputStyles, inputStyle]}>
        {children}
      </Box>
    </Box>
  );
};

export const styles = StyleSheet.create({
  staticInputContainerStyles: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
  },
  staticInputStyles: {
    borderCurve: 'continuous',
    borderRadius: 40,
    borderWidth: THICKER_BORDER_WIDTH,
    overflow: 'hidden',
    padding: 20 - THICKER_BORDER_WIDTH,
    paddingBottom: 24 - THICKER_BORDER_WIDTH,
    width: BASE_INPUT_WIDTH,
  },
});
