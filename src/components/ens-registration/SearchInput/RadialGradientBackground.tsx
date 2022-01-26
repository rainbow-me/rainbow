import React, { useMemo } from 'react';
import { ViewProps } from 'react-native';
import RadialGradient, {
  RadialGradientProps,
} from 'react-native-radial-gradient';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { SearchInputProps } from './SearchInput';
import { useTheme } from '@rainbow-me/context';

type RadialGradientBackgroundProps = {
  variant: SearchInputProps['variant'];
  width: number;
  height: number;
  type?: 'default' | 'tint';
};

const RadialGradientBackground = ({
  variant = 'rainbow',
  width,
  height,
  type = 'default',
}: {
  variant: SearchInputProps['variant'];
  width: number;
  height: number;
  type?: 'default' | 'tint';
}) => {
  const { colors } = useTheme();

  const gradientSets = useMemo(
    () => ({
      rainbow: {
        default: colors.gradients.vividRainbow,
        tint: colors.gradients.vividRainbowTint,
      },
      success: {
        default: colors.gradients.success,
        tint: colors.gradients.successTint,
      },
      warning: {
        default: colors.gradients.warning,
        tint: colors.gradients.warningTint,
      },
    }),
    [
      colors.gradients.success,
      colors.gradients.successTint,
      colors.gradients.vividRainbow,
      colors.gradients.vividRainbowTint,
      colors.gradients.warning,
      colors.gradients.warningTint,
    ]
  );

  const gradients = Object.entries(gradientSets).map(([name, value]) => ({
    gradient: value[type],
    name,
  }));

  return (
    <>
      {gradients.map(({ name, gradient }, i) => (
        <AnimatedGradient
          center={[width, width / 2]}
          colors={gradient}
          currentVariant={variant}
          key={i}
          radius={width}
          stops={[0, 0.544872, 1]}
          style={[
            {
              height: width,
              position: 'absolute',
              top: -(width - height) / 2,
              transform: [
                {
                  scaleY: 0.7884615385,
                },
              ],
              width,
            },
          ]}
          variant={name as SearchInputProps['variant']}
        />
      ))}
    </>
  );
};

export default RadialGradientBackground;

//////////////////////////////////////////////////////////////////

const AnimatedRadialGradient = Animated.createAnimatedComponent(RadialGradient);

const AnimatedGradient = ({
  variant,
  currentVariant,
  style,
  ...props
}: RadialGradientProps & {
  variant: RadialGradientBackgroundProps['variant'];
  currentVariant: RadialGradientBackgroundProps['variant'];
  style: ViewProps['style'];
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(
      variant === currentVariant || variant === 'rainbow' ? 1 : 0,
      { duration: 200 }
    ),
  }));
  return <AnimatedRadialGradient {...props} style={[animatedStyle, style]} />;
};
