import React, { useEffect, useRef } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { useDimensions, useKeyboardHeight } from '../../hooks';
import Centered from './Centered';
import { position } from '@rainbow-me/styles';

const Container = styled(Transitioning.View)`
  height: ${({ height }) => height};
  left: 0;
  position: ${android ? 'relative' : 'absolute'};
  right: 0;
  top: 0;
`;

const InnerWrapper = styled(Centered)`
  ${position.size('100%')};
  padding-bottom: 10;
  padding-top: ${({ insets }) => insets.top};
`;

const transition = (
  <Transition.Change durationMs={150} interpolation="easeOut" />
);

export default function KeyboardFixedOpenLayout({
  additionalPadding = 0,
  ...props
}) {
  const insets = useSafeArea();
  const { height: screenHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
  const ref = useRef();

  const containerHeight = screenHeight - keyboardHeight - additionalPadding;
  ios &&
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => ref.current.animateNextTransition(), [containerHeight]);

  return (
    <Container height={containerHeight} ref={ref} transition={transition}>
      <KeyboardAvoidingView behavior="height" enabled={!keyboardHeight}>
        <InnerWrapper {...props} insets={insets} />
      </KeyboardAvoidingView>
    </Container>
  );
}
