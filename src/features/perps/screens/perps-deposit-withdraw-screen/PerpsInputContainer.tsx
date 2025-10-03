import { BASE_INPUT_WIDTH, ETH_COLOR_DARK, ETH_COLOR_DARK_ACCENT, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
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

const useContainerStyles = ({ asset, progress }: { asset: ExtendedAnimatedAssetWithColors | null; progress: SharedValue<number> }) => {
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();

  const bgColor = useDerivedValue(() => {
    return isDarkMode
      ? opacityWorklet(getColorValueForThemeWorklet(asset?.highContrastColor, isDarkMode), 0.08)
      : opacityWorklet(globalColors.white100, 0.8);
  });

  const expandedBgColor = useDerivedValue(() => {
    return isDarkMode ? bgColor.value : opacityWorklet(globalColors.white100, 0.8);
  });

  const strokeColor = useDerivedValue(() => {
    return isDarkMode
      ? opacityWorklet(
          getColorValueForThemeWorklet(asset?.highContrastColor, isDarkMode) === ETH_COLOR_DARK
            ? ETH_COLOR_DARK_ACCENT
            : getColorValueForThemeWorklet(asset?.highContrastColor, isDarkMode),
          0.06
        )
      : globalColors.white100;
  });

  const expandedStrokeColor = useDerivedValue(() => {
    return isDarkMode ? opacityWorklet(getColorValueForThemeWorklet(asset?.highContrastColor, isDarkMode), 0.1) : globalColors.white100;
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(1, TIMING_CONFIGS.fadeConfig),
      shadowColor: isDarkMode ? 'transparent' : getColorValueForThemeWorklet(asset?.mixedShadowColor, isDarkMode),
    };
  });

  const inputStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        interpolateColor(progress.value, [0, 1], [bgColor.value, expandedBgColor.value]),
        TIMING_CONFIGS.fadeConfig
      ),
      borderColor: withTiming(
        interpolateColor(progress.value, [0, 1], [strokeColor.value, expandedStrokeColor.value]),
        TIMING_CONFIGS.fadeConfig
      ),
      height: withSpring(
        interpolate(progress.value, [0, 1], [BASE_INPUT_HEIGHT, EXPANDED_INPUT_HEIGHT], 'clamp'),
        SPRING_CONFIGS.springConfig
      ),
      // Make sure to push the view under this out of the screen.
      marginBottom: withSpring(interpolate(progress.value, [0, 1], [0, safeAreaInsets.bottom], 'clamp'), SPRING_CONFIGS.springConfig),
    };
  });

  return { containerStyle, inputStyle };
};

export const PerpsInputContainer = ({
  asset,
  children,
  progress,
}: {
  asset: ExtendedAnimatedAssetWithColors | null;
  children?: ReactNode;
  progress: SharedValue<number>;
}) => {
  const { containerStyle, inputStyle } = useContainerStyles({
    asset,
    progress,
  });

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
    borderWidth: THICK_BORDER_WIDTH,
    overflow: 'hidden',
    padding: 20,
    width: BASE_INPUT_WIDTH,
  },
});
