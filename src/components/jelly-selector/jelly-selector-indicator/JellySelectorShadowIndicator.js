import React, { useMemo } from 'react';
import Animated from 'react-native-reanimated';
import ShadowStack from 'react-native-shadow-stack';

const AnimatedShadowStack = Animated.createAnimatedComponent(ShadowStack);

export default function JellySelectorShadowIndicator({
  height,
  translateX,
  width,
  ...props
}) {
  const { colors } = useTheme();

  const JellySelectorIndicatorShadow = useMemo(
    () => [
      [0, 0, 9, colors.shadowGrey, 0.1],
      [0, 5, 15, colors.shadowGrey, 0.12],
      [0, 10, 30, colors.shadowGrey, 0.06],
    ],
    [colors.shadowGrey]
  );

  return (
    <AnimatedShadowStack
      borderRadius={height / 2}
      height={height}
      shadows={JellySelectorIndicatorShadow}
      style={{ transform: [{ translateX }], width }}
      {...props}
    />
  );
}
