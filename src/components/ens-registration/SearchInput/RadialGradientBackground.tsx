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
  state: SearchInputProps['state'];
  type?: 'default' | 'tint';
};

const RadialGradientBackground = ({
  variant,
  width,
  height,
  state,
  type = 'default',
}: RadialGradientBackgroundProps) => {
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
          currentState={state}
          height={height}
          key={i}
          name={name}
          variant={variant}
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
  currentState,
  height,
  name,
  width,
  ...props
}: RadialGradientProps & {
  variant: RadialGradientBackgroundProps['variant'];
  currentState: RadialGradientBackgroundProps['state'];
  name: string;
  height: number;
  width: number;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(name === currentState || name === variant ? 1 : 0, {
      duration: 200,
    }),
  }));

  const center = useMemo(() => [width, width / 2], [width]);
  const stops = useMemo(() => [0, 0.6354, 1], []);

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
          width,
        },
      ]}
    />
  );
};
