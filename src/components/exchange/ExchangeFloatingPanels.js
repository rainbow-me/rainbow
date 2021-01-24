import { useRoute } from '@react-navigation/native';
import React from 'react';
import Animated, { Extrapolate } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { useCallbackOne, useMemoOne } from 'use-memo-one';
import { interpolate } from '../animations';
import { FloatingPanels } from '../floating-panels';

const ExchangeFloatingPanels = styled(FloatingPanels).attrs({
  margin: 0,
})`
  padding-top: 24;
`;

const AnimatedExchangeFloatingPanels = Animated.createAnimatedComponent(
  ExchangeFloatingPanels
);

function ExchangeFloatingPanelsIOS(props) {
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

  return <AnimatedExchangeFloatingPanels {...props} style={animatedStyle} />;
}

// animation is only available on iOS
export default ios ? ExchangeFloatingPanelsIOS : ExchangeFloatingPanels;
