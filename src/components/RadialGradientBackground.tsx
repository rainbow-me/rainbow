import React, { useMemo } from 'react';
import RadialGradient, { RadialGradientProps } from 'react-native-radial-gradient';
import Animated from 'react-native-reanimated';

const AnimatedRadialGradient = Animated.createAnimatedComponent(RadialGradient);

export type RadialGradientBackgroundProps = RadialGradientProps & {
  width: number;
  height: number;
};

const RadialGradientBackground = ({ height, width, style, ...props }: RadialGradientBackgroundProps) => {
  const center = useMemo(() => [width, width / 2], [width]);

  return (
    <AnimatedRadialGradient
      {...props}
      center={center}
      radius={width}
      style={useMemo(
        () => [
          style,
          {
            height: width,
            position: 'absolute',
            top: -(width - height) / 2,
            width,
          },
        ],
        [height, style, width]
      )}
    />
  );
};

export default RadialGradientBackground;
