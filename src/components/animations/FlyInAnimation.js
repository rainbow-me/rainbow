import React from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import { useTimingTransition } from 'react-native-redash';
import styled from 'styled-components/primitives';
import { sheetVerticalOffset } from '../../navigation/transitions/effects';
import { interpolate } from './procs';

const AnimatedContainer = styled(Animated.View)`
  flex: 1;
  padding-bottom: ${sheetVerticalOffset};
  width: 100%;
`;

export default function FlyInAnimation({ children }) {
  const animation = useTimingTransition(true, {
    duration: 175,
    easing: Easing.bezier(0.165, 0.84, 0.44, 1),
  });

  const opacity = interpolate(animation, {
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = interpolate(animation, {
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  return (
    <AnimatedContainer style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </AnimatedContainer>
  );
}
