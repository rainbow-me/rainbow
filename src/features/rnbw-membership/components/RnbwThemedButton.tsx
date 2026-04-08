import React, { memo, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Text, useColorMode, type TextProps } from '@/design-system';
import { GradientText } from '@/components/text';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { opacity } from '@/framework/ui/utils/opacity';
import { getValueForColorMode } from '@/design-system/color/palettes';

type ShadowStyle = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius'>;

const CONFIG = {
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
        {
          shadowColor: '#8A6216',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
        },
        {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 2.5,
        },
      ] satisfies ShadowStyle[],
      dark: [
        {
          shadowColor: '#FFDD20',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
        },
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
        {
          shadowColor: '#8A6216',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
        },
        {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 2.5,
        },
      ] satisfies ShadowStyle[],
      dark: [
        {
          shadowColor: '#F8DE7D',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
        },
      ] satisfies ShadowStyle[],
    },
  },
} as const;

export const RnbwThemedButton = memo(function RnbwThemedButton({
  variant = 'primary',
  label,
  height = 42,
  size = '22pt',
  weight = 'heavy',
  onPress,
  style,
  containerStyle,
}: {
  variant?: 'primary' | 'secondary';
  label: string;
  height?: number;
  size?: TextProps['size'];
  weight?: TextProps['weight'];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const { isDarkMode, colorMode } = useColorMode();
  const borderRadius = height / 2;

  const { borderGradientColors, gradientColors, shadows } = useMemo(() => {
    return {
      borderGradientColors: getValueForColorMode(CONFIG[variant].border, colorMode),
      gradientColors: getValueForColorMode(CONFIG[variant].colors, colorMode),
      shadows: getValueForColorMode(CONFIG[variant].shadows, colorMode),
    };
  }, [variant, colorMode]);

  const resolvedContainerStyle = useMemo(() => {
    return [
      {
        height,
        borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
      },
      shadows,
      containerStyle,
    ] satisfies StyleProp<ViewStyle>[];
  }, [height, borderRadius, containerStyle, shadows]);

  return (
    <ButtonPressAnimation onPress={onPress} style={style} scaleTo={0.96}>
      <GradientBorderView
        borderWidth={isDarkMode ? THICK_BORDER_WIDTH : 1}
        borderGradientColors={borderGradientColors}
        start={CONFIG.gradient.start}
        end={CONFIG.gradient.end}
        style={resolvedContainerStyle}
      >
        <LinearGradient
          colors={gradientColors}
          start={CONFIG.gradient.start}
          end={CONFIG.gradient.end}
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
        {variant === 'primary' ? (
          <GradientText
            colors={CONFIG.primary.text.colors}
            start={CONFIG.primary.text.start}
            end={CONFIG.primary.text.end}
            shadow={CONFIG.primary.text.shadow}
          >
            <Text size={size} weight={weight} color="label">
              {label}
            </Text>
          </GradientText>
        ) : (
          <Text size={size} weight={weight} color={{ custom: getValueForColorMode(CONFIG.secondary.text.color, colorMode) }}>
            {label}
          </Text>
        )}
        <InnerShadow color={'rgba(255, 255, 255, 0.1)'} blur={1} dx={0} dy={3} borderRadius={borderRadius} />
      </GradientBorderView>
    </ButtonPressAnimation>
  );
});
