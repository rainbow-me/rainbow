import React, { useMemo } from 'react';
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
        <AnimatedRadialGradient
          colors={gradient}
          currentVariant={variant}
          height={height}
          key={i}
          variant={name as SearchInputProps['variant']}
          width={width}
        />
      ))}
    </>
  );
};

export default RadialGradientBackground;

//////////////////////////////////////////////////////////////////

const AnimatedGradient = Animated.createAnimatedComponent(RadialGradient);

const AnimatedRadialGradient = ({
  variant,
  currentVariant,
  height,
  width,
  ...props
}: RadialGradientProps & {
  variant: RadialGradientBackgroundProps['variant'];
  currentVariant: RadialGradientBackgroundProps['variant'];
  height: number;
  width: number;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(
      variant === currentVariant || variant === 'rainbow' ? 1 : 0,
      { duration: 200 }
    ),
  }));

  const center = useMemo(() => [width, width / 2], [width]);
  const stops = useMemo(() => [0, 0.544872, 1], []);

  return (
    <AnimatedGradient
      {...props}
      center={center}
      radius={width}
      stops={stops}
      style={[
        animatedStyle,
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
    />
  );
};
