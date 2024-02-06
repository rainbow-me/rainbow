import React, { useMemo } from 'react';
import { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import RadialGradientBackground, { RadialGradientBackgroundProps } from '../../RadialGradientBackground';
import { SearchInputProps } from './SearchInput';
import { useTheme } from '@/theme';

type SearchInputGradientBackgroundProps = {
  variant: SearchInputProps['variant'];
  width: number;
  height: number;
  state: SearchInputProps['state'];
  type?: 'default' | 'tint';
};

const SearchInputGradientBackground = ({ variant, width, height, state, type = 'default' }: SearchInputGradientBackgroundProps) => {
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

export default SearchInputGradientBackground;

const AnimatedRadialGradient = ({
  variant,
  currentState,
  name,
  ...props
}: RadialGradientBackgroundProps & {
  variant: SearchInputGradientBackgroundProps['variant'];
  currentState: SearchInputGradientBackgroundProps['state'];
  name: string;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(name === currentState || name === variant ? 1 : 0, {
      duration: 200,
    }),
  }));

  return <RadialGradientBackground {...props} style={animatedStyle} />;
};
