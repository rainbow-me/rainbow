import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  useSharedValue,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { IS_TEST } from '@/env';
import { useTheme } from '@/theme';

const timingConfig = {
  duration: 2500,
  easing: Easing.bezier(0.76, 0, 0.24, 1),
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

type ShimmerAnimationProps = {
  color: string;
  animationDuration?: number;
  enabled?: boolean;
  gradientColor?: string;
  width?: number;
};

export default function ShimmerAnimation({
  color,
  animationDuration = timingConfig.duration,
  enabled = true,
  gradientColor = '',
  width = 0,
}: ShimmerAnimationProps) {
  const containerWidth = useSharedValue(width);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isEnabled = useSharedValue(enabled);

  const { colors } = useTheme();
  const gradientColors = useMemo(
    () => [colors.alpha(color, 0), gradientColor || colors.alpha(colors.whiteLabel, 0.2), colors.alpha(color, 0)],
    [gradientColor, color, colors]
  );

  // Keep internal shared value track of changes to the props
  useEffect(() => {
    isEnabled.value = enabled;
    containerWidth.value = width;
  }, [enabled, isEnabled, width, containerWidth]);

  const startAnimation = useCallback(() => {
    'worklet';
    if (containerWidth.value === 0) return;

    translateX.value = withRepeat(
      withSequence(
        withTiming(-containerWidth.value * 1.5, { duration: 0 }),
        withTiming(containerWidth.value * 1.5, {
          duration: animationDuration,
          easing: timingConfig.easing,
        })
      ),
      -1
    );
    opacity.value = withTiming(1, {
      duration: animationDuration / 2,
      easing: timingConfig.easing,
    });
  }, [containerWidth, animationDuration, translateX, opacity]);

  const stopAnimation = useCallback(() => {
    'worklet';
    cancelAnimation(translateX);
    opacity.value = withTiming(0, {
      duration: animationDuration / 2,
      easing: timingConfig.easing,
    });
  }, [animationDuration, translateX, opacity]);

  // React to changes in width or enabled state
  useAnimatedReaction(
    () => ({
      width: containerWidth.value,
      enabled: isEnabled.value,
    }),
    (current, previous) => {
      if (!current.width || current.width === previous?.width) return;

      if (current.enabled) {
        startAnimation();
      } else {
        stopAnimation();
      }
    },
    [startAnimation, stopAnimation]
  );

  const handleLayout = useCallback(
    ({ nativeEvent: { layout } }: { nativeEvent: { layout: { width: number } } }) => {
      // Allow for explicit width to override the default width
      if (width > 0) return;

      containerWidth.value = layout.width;
    },
    [containerWidth, width]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  if (IS_TEST) return null;

  return (
    <AnimatedLinearGradient
      colors={gradientColors}
      end={{ x: 0, y: 0.5 }}
      start={{ x: 1, y: 0.5 }}
      style={[animatedStyle, StyleSheet.absoluteFill]}
      onLayout={handleLayout}
    />
  );
}
