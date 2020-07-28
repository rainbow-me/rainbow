import React from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import { useTimingTransition } from 'react-native-redash';
import styled from 'styled-components/primitives';
import { interpolate } from './procs';

const AnimatedContainer = styled(Animated.View)`
  flex: 1;
  width: 100%;
`;

export default function FlyInAnimation({
  distance = 30,
  duration = 175,
  style,
  ...props
}) {
  const opacity = useTimingTransition(true, {
    duration,
    easing: Easing.bezier(0.165, 0.84, 0.44, 1),
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
