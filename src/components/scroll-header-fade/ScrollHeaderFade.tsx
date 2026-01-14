import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { globalColors } from '@/design-system/color/palettes';
import { useColorMode } from '@/design-system/color/ColorMode';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

// ============ Constants ======================================================= //

export const DEFAULT_SCROLL_FADE_DISTANCE = 8;
const DEFAULT_HEIGHT = 32;

// ============ Types =========================================================== //

export type ScrollHeaderFadeProps = {
  /** Gradient color (defaults to theme background) */
  color?: string;
  /** Scroll distance over which fade animates (default: 8) */
  fadeDistance?: number;
  /** Height of gradient (default: 32) */
  height?: number;
  /** Scroll position shared value to animate against */
  scrollOffset: SharedValue<number>;
  /** Top offset for positioning (default: 0) */
  topInset?: number;
};

// ============ Component ======================================================= //

export const ScrollHeaderFade = memo(function ScrollHeaderFade({
  color,
  fadeDistance = DEFAULT_SCROLL_FADE_DISTANCE,
  height = DEFAULT_HEIGHT,
  scrollOffset,
  topInset = 0,
}: ScrollHeaderFadeProps) {
  const { isDarkMode } = useColorMode();
  const gradientColor = color ?? (isDarkMode ? globalColors.grey100 : globalColors.white100);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollOffset.value, [0, fadeDistance], [0, 1], 'clamp'),
  }));

  return (
    <Animated.View style={[styles.container, { top: topInset }, fadeStyle]}>
      <EasingGradient
        endColor={gradientColor}
        endOpacity={0}
        startColor={gradientColor}
        startOpacity={1}
        style={[styles.gradient, { height }]}
      />
    </Animated.View>
  );
});

// ============ Styles ========================================================== //

const styles = StyleSheet.create({
  container: {
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    zIndex: 1000,
  },
  gradient: {
    width: DEVICE_WIDTH,
  },
});
