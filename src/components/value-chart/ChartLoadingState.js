import React, { useEffect, useRef } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import ActivityIndicator from '../ActivityIndicator';
import { Centered } from '../layout';
import { colors, position } from '@rainbow-me/styles';

const duration = 420.69;
const transition = (
  <Transition.Sequence>
    <Transition.Out durationMs={duration} interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={duration} interpolation="easeOut" />
    <Transition.In durationMs={duration} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

const Container = styled(Transitioning.View).attrs({
  pointerEvents: 'none',
})`
  ${position.cover};
`;

const Overlay = styled(Centered).attrs({
  pointerEvents: 'none',
})`
  ${position.cover};
  background-color: ${colors.alpha(colors.white, 0.69)};
`;

export default function ChartLoadingState({ color, isVisible }) {
  const transitionRef = useRef();

  useEffect(() => {
    transitionRef.current?.animateNextTransition();
  }, [isVisible]);

  return (
    <Container ref={transitionRef} transition={transition}>
      {isVisible ? (
        <Overlay>
          <ActivityIndicator color={color} />
        </Overlay>
      ) : null}
    </Container>
  );
}
