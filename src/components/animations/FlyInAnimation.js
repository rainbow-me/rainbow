import React from 'react';
import Animated, { Easing, FadeInDown, FadeOut } from 'react-native-reanimated';
import styled from '@rainbow-me/styled-components';

const AnimatedContainer = styled(Animated.View)({
  flex: 1,
  width: '100%',
});

export default function FlyInAnimation({
  distance = 30,
  duration = 175,
  ...props
}) {
  return (
    <AnimatedContainer
      {...props}
      entering={FadeInDown.duration(duration)
        .easing(Easing.bezier(0.165, 0.84, 0.44, 1))
        .withInitialValues({ transform: [{ translateY: distance }] })
        .delay(duration / 3)}
      exiting={FadeOut.duration(duration / 3).easing(
        Easing.bezier(0.165, 0.84, 0.44, 1)
      )}
    />
  );
}
