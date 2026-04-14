import React, { memo, useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { useColorMode } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { RNBW_BUTTON_CONFIG } from '@/features/rnbw-membership/rnbwButtonTheme';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

type RnbwButtonSurfaceProps = {
  variant?: 'primary' | 'secondary';
  height?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const RnbwButtonSurface = memo(function RnbwButtonSurface({
  variant = 'primary',
  height = 42,
  children,
  style,
}: RnbwButtonSurfaceProps) {
  const { isDarkMode, colorMode } = useColorMode();
  const borderRadius = height / 2;

  const { borderGradientColors, gradientColors, surfaceHighlight, shadows } = useMemo(
    () => ({
      borderGradientColors: getValueForColorMode(RNBW_BUTTON_CONFIG[variant].border, colorMode),
      gradientColors: getValueForColorMode(RNBW_BUTTON_CONFIG[variant].colors, colorMode),
      surfaceHighlight: variant === 'primary' ? getValueForColorMode(RNBW_BUTTON_CONFIG.primary.highlight, colorMode) : null,
      shadows: getValueForColorMode(RNBW_BUTTON_CONFIG[variant].shadows, colorMode),
    }),
    [variant, colorMode]
  );

  const resolvedContainerStyle = useMemo(
    () =>
      [
        {
          height,
          borderRadius,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'visible',
        },
        shadows,
        style,
      ] satisfies StyleProp<ViewStyle>[],
    [height, borderRadius, style, shadows]
  );

  return (
    <GradientBorderView
      borderWidth={isDarkMode ? THICK_BORDER_WIDTH : 1}
      borderGradientColors={borderGradientColors}
      start={RNBW_BUTTON_CONFIG.gradient.start}
      end={RNBW_BUTTON_CONFIG.gradient.end}
      style={resolvedContainerStyle}
    >
      <LinearGradient
        colors={gradientColors}
        start={RNBW_BUTTON_CONFIG.gradient.start}
        end={RNBW_BUTTON_CONFIG.gradient.end}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      {surfaceHighlight && (
        <LinearGradient
          colors={surfaceHighlight.colors}
          start={surfaceHighlight.start}
          end={surfaceHighlight.end}
          style={StyleSheet.absoluteFill}
        />
      )}
      <InnerShadow color={'rgba(255, 255, 255, 0.1)'} blur={1} dx={0} dy={3} borderRadius={borderRadius} />
      {children}
    </GradientBorderView>
  );
});
