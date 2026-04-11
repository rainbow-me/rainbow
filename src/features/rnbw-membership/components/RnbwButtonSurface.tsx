import React, { memo, useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { GradientText } from '@/components/text';
import { Text, useColorMode, type TextProps } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

type ShadowStyle = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius'>;

export const RNBW_BUTTON_CONFIG = {
  gradient: {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  primary: {
    colors: ['#FFE380', '#E3A700'],
    border: {
      light: [opacity('#B5910D', 0.1125), opacity('#B5910D', 0.15)],
      dark: [opacity('#B5910D', 0.1125), opacity('#B5910D', 0.15)],
    },
    text: {
      colors: ['#4F3605', '#90630E'],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      shadow: {
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
        textShadowColor: 'rgba(255, 255, 255, 0.26)',
      },
    },
    shadows: {
      light: [
        { shadowColor: '#8A6216', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
        { shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 2.5 },
      ] satisfies ShadowStyle[],
      dark: [
        { shadowColor: '#FFDD20', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 },
      ] satisfies ShadowStyle[],
    },
  },
  secondary: {
    colors: {
      light: [opacity('#F8DE7D', 0.4), opacity('#D9B550', 0.4)],
      dark: [opacity('#FFE380', 0.1), opacity('#E3A700', 0.1)],
    },
    border: {
      light: [opacity('#B5910D', 0.08), opacity('#B5910D', 0.08)],
      dark: [opacity('#B5910D', 0.049), opacity('#B5910D', 0.07)],
    },
    text: {
      color: { light: '#6F4D0A', dark: '#FAD96B' },
    },
    shadows: {
      light: [
        { shadowColor: '#8A6216', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
        { shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 2.5 },
      ] satisfies ShadowStyle[],
      dark: [
        { shadowColor: '#F8DE7D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      ] satisfies ShadowStyle[],
    },
  },
} as const;

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

  const { borderGradientColors, gradientColors, shadows } = useMemo(
    () => ({
      borderGradientColors: getValueForColorMode(RNBW_BUTTON_CONFIG[variant].border, colorMode),
      gradientColors: getValueForColorMode(RNBW_BUTTON_CONFIG[variant].colors, colorMode),
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
      {variant === 'primary' && (
        <LinearGradient
          colors={[opacity('#FFE67E', 0), opacity('#FFE67E', 0.5), opacity('#FFE67E', 0)]}
          start={{ x: 0.25, y: 0.5 }}
          end={{ x: 0.75, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <InnerShadow color={'rgba(255, 255, 255, 0.1)'} blur={1} dx={0} dy={3} borderRadius={borderRadius} />
      {children}
    </GradientBorderView>
  );
});

export const RnbwButtonText = memo(function RnbwButtonText({
  variant = 'primary',
  size = '20pt',
  weight = 'heavy',
  children,
}: {
  variant?: 'primary' | 'secondary';
  size?: TextProps['size'];
  weight?: TextProps['weight'];
  children: string;
}) {
  const { colorMode } = useColorMode();

  if (variant === 'primary') {
    return (
      <GradientText
        colors={RNBW_BUTTON_CONFIG.primary.text.colors}
        start={RNBW_BUTTON_CONFIG.primary.text.start}
        end={RNBW_BUTTON_CONFIG.primary.text.end}
        shadow={RNBW_BUTTON_CONFIG.primary.text.shadow}
      >
        <Text size={size} weight={weight} color="label">
          {children}
        </Text>
      </GradientText>
    );
  }

  return (
    <Text size={size} weight={weight} color={{ custom: getValueForColorMode(RNBW_BUTTON_CONFIG.secondary.text.color, colorMode) }}>
      {children}
    </Text>
  );
});
