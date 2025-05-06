import React from 'react';
import Animated, { AnimatedProps, Easing, FadeInDown, FadeOut } from 'react-native-reanimated';
import styled from '@/styled-thing';
import { ViewProps } from 'react-native';

const AnimatedContainer = styled(Animated.View)({
  flex: 1,
  width: '100%',
});

const easing = Easing.bezier(0.4, 0, 0.22, 1).factory();

type FlyInAnimationProps = {
  distance?: number;
  duration?: number;
  props: Omit<AnimatedProps<ViewProps>, 'entering' | 'exiting'>;
};

export default function FlyInAnimation({ distance = 16, duration = 100, ...props }: FlyInAnimationProps) {
  const exitDuration = duration / 3;
  return (
    <AnimatedContainer
      {...props}
      entering={FadeInDown.duration(duration)
        .easing(easing)
        .withInitialValues({ transform: [{ translateY: distance }] })
        .delay(exitDuration)}
      exiting={FadeOut.duration(exitDuration).easing(easing)}
    />
  );
}
