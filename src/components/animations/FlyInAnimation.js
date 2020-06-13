import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import Animated, { Easing } from 'react-native-reanimated';
import { useTimingTransition } from 'react-native-redash';
import styled from 'styled-components/primitives';
import { interpolate } from './procs';

const statusBarHeight = getStatusBarHeight(true);

const AnimatedContainer = styled(Animated.View)`
  flex: 1;
  padding-bottom: ${statusBarHeight};
  width: 100%;
`;

export default function FlyInAnimation({
  distance = 30,
  duration = 175,
  style,
  ...props
}) {
  const animation = useTimingTransition(true, {
    duration,
    easing: Easing.bezier(0.165, 0.84, 0.44, 1),
  });

  const opacity = interpolate(animation, {
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = interpolate(animation, {
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
