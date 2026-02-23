import React, { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { NAVBAR_HEIGHT_WITH_PADDING } from '@/components/navbar/constants';
import { Box, globalColors, useColorMode } from '@/design-system';
import { BASE_INPUT_WIDTH, ETH_COLOR_DARK, ETH_COLOR_DARK_ACCENT } from '@/__swaps__/screens/Swap/constants';
import { TOKEN_SEARCH_FOCUSED_INPUT_HEIGHT } from '@/components/token-search/constants';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { opacity } from '@/framework/ui/utils/opacity';
import { BASE_INPUT_HEIGHT, EXPANDED_INPUT_HEIGHT, NavigationSteps } from '../../constants';
import { useDepositContext } from '../../contexts/DepositContext';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';

// ============ Constants ====================================================== //

const INTERPOLATION_OUTPUT_RANGE = Object.freeze([
  NavigationSteps.INPUT_ELEMENT_FOCUSED,
  NavigationSteps.TOKEN_LIST_FOCUSED,
  NavigationSteps.SEARCH_FOCUSED,
]);
const SEARCH_FOCUSED_TRANSLATE_Y = -NAVBAR_HEIGHT_WITH_PADDING;

// ============ Styles Hook ==================================================== //

function useContainerStyles({ progress }: { progress: SharedValue<number> }) {
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();
  const { minifiedAsset } = useDepositContext();

  const currentAssetColor = useDerivedValue(() => minifiedAsset.value?.highContrastColor);

  const bgColor = useDerivedValue(() => {
    return isDarkMode
      ? opacity(getColorValueForThemeWorklet(currentAssetColor.value, isDarkMode), 0.08)
      : opacity(globalColors.white100, 0.8);
  });

  const expandedBgColor = useDerivedValue(() => {
    return isDarkMode ? bgColor.value : opacity(globalColors.white100, 0.8);
  });

  const strokeColor = useDerivedValue(() => {
    const color = currentAssetColor.value;
    return isDarkMode
      ? opacity(
          getColorValueForThemeWorklet(color, isDarkMode) === ETH_COLOR_DARK
            ? ETH_COLOR_DARK_ACCENT
            : getColorValueForThemeWorklet(color, isDarkMode),
          0.06
        )
      : globalColors.white100;
  });

  const expandedStrokeColor = useDerivedValue(() => {
    return isDarkMode ? opacity(getColorValueForThemeWorklet(currentAssetColor.value, isDarkMode), 0.1) : globalColors.white100;
  });

  const containerStyle = useAnimatedStyle(() => {
    const isSearchFocused = progress.value === NavigationSteps.SEARCH_FOCUSED;
    return {
      shadowColor: isDarkMode ? 'transparent' : getColorValueForThemeWorklet(currentAssetColor.value, isDarkMode),
      transform: [
        {
          translateY: withSpring(isSearchFocused ? SEARCH_FOCUSED_TRANSLATE_Y : 0, SPRING_CONFIGS.keyboardConfig),
        },
      ],
    };
  });

  const inputStyle = useAnimatedStyle(() => {
    const currentProgress = progress.value;
    return {
      backgroundColor: withTiming(
        interpolateColor(currentProgress, INTERPOLATION_OUTPUT_RANGE, [bgColor.value, expandedBgColor.value, expandedBgColor.value]),
        TIMING_CONFIGS.fadeConfig
      ),
      borderColor: withTiming(
        interpolateColor(currentProgress, INTERPOLATION_OUTPUT_RANGE, [
          strokeColor.value,
          expandedStrokeColor.value,
          expandedStrokeColor.value,
        ]),
        TIMING_CONFIGS.fadeConfig
      ),
      height: withSpring(
        interpolate(
          currentProgress,
          INTERPOLATION_OUTPUT_RANGE,
          [BASE_INPUT_HEIGHT, EXPANDED_INPUT_HEIGHT, TOKEN_SEARCH_FOCUSED_INPUT_HEIGHT],
          'clamp'
        ),
        SPRING_CONFIGS.springConfig
      ),
      marginBottom: withSpring(
        interpolate(currentProgress, INTERPOLATION_OUTPUT_RANGE, [0, safeAreaInsets.bottom, safeAreaInsets.bottom], 'clamp'),
        SPRING_CONFIGS.springConfig
      ),
    };
  });

  return { containerStyle, inputStyle };
}

// ============ Component ====================================================== //

export function DepositInputContainer({ children, progress }: { children?: ReactNode; progress: SharedValue<number> }) {
  const { containerStyle, inputStyle } = useContainerStyles({ progress });

  return (
    <Box as={Animated.View} style={[styles.staticInputContainerStyles, containerStyle]} width={{ custom: BASE_INPUT_WIDTH }}>
      <Box as={Animated.View} style={[styles.staticInputStyles, inputStyle]}>
        {children}
      </Box>
    </Box>
  );
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
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
