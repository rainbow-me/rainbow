import React, { ReactNode, memo, useMemo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'react-native-blur-view';
import Animated, { AnimatedStyle, Easing } from 'react-native-reanimated';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';

type FadeTo = 'top' | 'bottom' | 'left' | 'right';
type GradientPoints = [from: { x: number; y: number }, to: { x: number; y: number }];
type ValueByTheme<T> = { dark: T; light: T };

type BlurGradientParams = {
  /**
   * A component to render in place of the `BlurView` on Android.
   *
   * Note that if a non-transparent `color` is provided, by default a gradient
   * overlay will be visible on both platforms regardless of the value provided here.
   *
   * @default null
   */
  androidBlurFallback?: ReactNode;
  color?: string | ValueByTheme<string>;
  feather?: number;
  /**
   * The amount of buffer space between the start of the blur and the start of the
   * gradient overlay. Has no effect if `color` is `transparent`.
   *
   * @default 0
   */
  gradientBuffer?: number;
  gradientOpacity?: number | ValueByTheme<number>;
  height: number;
  intensity?: number;
  saturation?: number;
  style?: StyleProp<ViewStyle> | AnimatedStyle<ViewStyle>;
  width: number;
} & ({ fadeTo?: FadeTo; gradientPoints?: never } | { fadeTo?: never; gradientPoints?: GradientPoints });

export const BlurGradient = memo(function BlurGradient({
  androidBlurFallback = null,
  color = 'transparent',
  fadeTo = 'top',
  feather = 8,
  gradientBuffer = 0,
  gradientOpacity = IS_IOS ? { dark: 0.96, light: 0.92 } : { dark: 1, light: 1 },
  gradientPoints: gradientPointsProp,
  height,
  intensity = 8,
  saturation = color === 'transparent' ? 1 : undefined,
  style,
  width,
}: BlurGradientParams) {
  const { isDarkMode } = useColorMode();

  const { darkAlpha, darkColor, gradientPoints, lightAlpha, lightColor } = useMemo(() => {
    const { dark: darkColor, light: lightColor } = typeof color === 'object' ? color : { dark: color, light: color };
    const { dark: darkAlpha, light: lightAlpha } =
      typeof gradientOpacity === 'object' ? gradientOpacity : { dark: gradientOpacity, light: gradientOpacity };

    const gradientPoints = gradientPointsProp ?? getGradientPoints(fadeTo);

    return { darkAlpha, darkColor, gradientPoints, lightAlpha, lightColor };
  }, [color, fadeTo, gradientOpacity, gradientPointsProp]);

  return (
    <Animated.View style={[styles.blurHeaderWrapper, style, { height, width }]}>
      {IS_IOS ? (
        <BlurView
          blurIntensity={intensity}
          blurStyle="variable"
          feather={feather}
          gradientPoints={gradientPoints}
          saturationIntensity={color === 'transparent' ? saturation : undefined}
          style={{ height, width }}
        />
      ) : (
        androidBlurFallback
      )}

      {color === 'transparent' ? null : (
        <EasingGradient
          easing={Easing.inOut(Easing.quad)}
          endColor={isDarkMode ? darkColor : lightColor}
          endOpacity={0}
          endPosition={{ x: gradientPoints[0].x, y: gradientPoints[0].y }}
          startColor={isDarkMode ? darkColor : lightColor}
          startOpacity={isDarkMode ? darkAlpha : lightAlpha}
          startPosition={{ x: gradientPoints[1].x, y: gradientPoints[1].y }}
          steps={Math.min(Math.floor((fadeTo === 'top' || fadeTo === 'bottom' ? height : width) / 5.35), 32)}
          style={[
            styles.blurHeaderContent,
            {
              [getGradientBufferPosition(fadeTo)]: gradientBuffer,
              height: height - gradientBuffer,
              width,
            },
          ]}
        />
      )}
    </Animated.View>
  );
});

function getGradientBufferPosition(fadeTo: FadeTo): 'bottom' | 'left' | 'right' | 'top' {
  switch (fadeTo) {
    case 'bottom':
      return 'top';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
    case 'top':
    default:
      return 'bottom';
  }
}

function getGradientPoints(fadeTo: FadeTo): GradientPoints {
  switch (fadeTo) {
    case 'bottom':
      return [
        { x: 0.5, y: 0 },
        { x: 0.5, y: 1 },
      ];
    case 'left':
      return [
        { x: 0, y: 0.5 },
        { x: 1, y: 0.5 },
      ];
    case 'right':
      return [
        { x: 1, y: 0.5 },
        { x: 0, y: 0.5 },
      ];
    case 'top':
    default:
      return [
        { x: 0.5, y: 1 },
        { x: 0.5, y: 0 },
      ];
  }
}

const styles = StyleSheet.create({
  blurHeaderContent: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  blurHeaderWrapper: {
    pointerEvents: 'none',
    position: 'relative',
  },
});
