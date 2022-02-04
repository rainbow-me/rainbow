import React from 'react';
import Animated, { EasingNode } from 'react-native-reanimated';
import { useTimingTransition } from 'react-native-redash/src/v1';
import { interpolate } from './procs';
import styled from '@rainbow-me/styled-components';

const AnimatedContainer = styled(Animated.View)({
  flex: 1,
  width: '100%',
});

export default function FlyInAnimation({
  distance = 30,
  duration = 175,
  style,
  ...props
}) {
  const opacity = useTimingTransition(true, {
    duration,
    easing: EasingNode.bezier(0.165, 0.84, 0.44, 1),
  });

  const translateY = interpolate(opacity, {
    inputRange: [0, 1],
    outputRange: [distance, 0],
  });

  return (
    <AnimatedContainer
      {...props}
      style={[style, { opacity, transform: [{ translateY }] }]}
    />
  );
}
