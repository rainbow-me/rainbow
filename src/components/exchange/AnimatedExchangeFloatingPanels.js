import { useRoute } from '@react-navigation/native';
import React from 'react';
import Animated, { Extrapolate } from 'react-native-reanimated';
import { useCallbackOne, useMemoOne } from 'use-memo-one';
import { interpolate } from '../animations';
import ExchangeFloatingPanels from './ExchangeFloatingPanels';

const AnimatedPanels = Animated.createAnimatedComponent(ExchangeFloatingPanels);

export default function AnimatedExchangeFloatingPanels(props) {
  const {
    params: { tabTransitionPosition },
  } = useRoute();

  const buildInterpolation = useCallbackOne(
    outputRange =>
      interpolate(tabTransitionPosition, {
        extrapolate: Extrapolate.CLAMP,
        inputRange: [0, 0, 1],
        outputRange,
      }),
    [tabTransitionPosition]
  );

  const animatedStyle = useMemoOne(
    () => ({
      opacity: buildInterpolation([1, 1, 0]),
      transform: [
        { scale: buildInterpolation([1, 1, 0.9]) },
        { translateX: buildInterpolation([0, 0, -8]) },
      ],
    }),
    [buildInterpolation]
  );

  return <AnimatedPanels {...props} style={animatedStyle} />;
}
