import React from 'react';
import Animated, { SpringUtils } from 'react-native-reanimated';
import { bin, useSpringTransition } from 'react-native-redash';
import { interpolate } from './procs';

export default function OpacityToggler({
  children,
  endingOpacity = 0,
  friction = 20,
  isVisible,
  startingOpacity = 1,
  style,
  tension = 200,
  ...props
}) {
  const animation = useSpringTransition(bin(isVisible), {
    ...SpringUtils.makeConfigFromOrigamiTensionAndFriction({
      ...SpringUtils.makeDefaultConfig(),
      friction,
      tension,
    }),
  });

  const opacity = interpolate(animation, {
    inputRange: [0, 1],
    outputRange: [startingOpacity, endingOpacity],
  });

  return (
    <Animated.View {...props} style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
}
