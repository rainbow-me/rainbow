import React, { ComponentProps } from 'react';
import Animated, { Easing, FadeInDown, FadeOut } from 'react-native-reanimated';
import styled from '@/styled-thing';

const AnimatedContainer = styled(Animated.View)({
  flex: 1,
  width: '100%',
});

const easing = Easing.bezier(0.4, 0, 0.22, 1).factory();

type FlyInAnimationProps = {
  distance?: number;
  duration?: number;
  props: Omit<ComponentProps<typeof AnimatedContainer>, 'entering' | 'exiting'>;
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
