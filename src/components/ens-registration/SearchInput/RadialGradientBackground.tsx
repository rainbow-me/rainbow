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
        default: {
          colors: colors.gradients.vividRainbow,
          stops: [0, 0.6354, 1],
        },
        tint: {
          colors: colors.gradients.vividRainbowTint,
          stops: [0, 0.6354, 1],
        },
      },
      success: {
        default: {
          colors: colors.gradients.success,
          stops: [0, 1],
        },
        tint: {
          colors: colors.gradients.successTint,
          stops: [0, 1],
        },
      },
      warning: {
        default: { colors: colors.gradients.warning, stops: [0, 1] },
        tint: { colors: colors.gradients.warningTint, stops: [0, 1] },
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
          colors={gradient.colors}
          currentState={state}
          height={height}
          key={i}
          name={name}
          stops={gradient.stops}
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
  stops,
  ...props
}: RadialGradientProps & {
  variant: RadialGradientBackgroundProps['variant'];
  currentState: RadialGradientBackgroundProps['state'];
  name: string;
  height: number;
  width: number;
  stops: number[];
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(name === currentState || name === variant ? 1 : 0, {
      duration: 200,
    }),
  }));

  const center = useMemo(() => [width, width / 2], [width]);

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
