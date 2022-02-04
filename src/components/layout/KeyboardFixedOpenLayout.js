import React, { useEffect, useRef } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { Transition, Transitioning } from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
import Centered from './Centered';
import { useDimensions, useKeyboardHeight } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const Container = styled(Transitioning.View)({
  height: ({ height }) => height,
  left: 0,
  position: ({ position }) => position,
  right: 0,
  top: 0,
});

const InnerWrapper = styled(Centered)({
  ...position.sizeAsObject('100%'),
  paddingBottom: 10,
  paddingTop: ({ insets }) => insets.top,
});

const transition = (
  <Transition.Change durationMs={150} interpolation="easeOut" />
);

export default function KeyboardFixedOpenLayout({
  additionalPadding = 0,
  position = android ? 'relative' : 'absolute',
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
    <Container
      height={containerHeight}
      position={position}
      ref={ref}
      transition={transition}
    >
      <KeyboardAvoidingView behavior="height" enabled={!!keyboardHeight}>
        <InnerWrapper {...props} insets={insets} />
      </KeyboardAvoidingView>
    </Container>
  );
}
