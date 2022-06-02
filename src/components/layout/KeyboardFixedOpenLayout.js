import React from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import Centered from './Centered';
import { useDimensions, useKeyboardHeight } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const Container = styled.View({
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

export default function KeyboardFixedOpenLayout({
  additionalPadding = 0,
  position = android ? 'relative' : 'absolute',
  ...props
}) {
  const insets = useSafeArea();
  const { height: screenHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();

  const containerHeight = screenHeight - keyboardHeight - additionalPadding;

  return (
    <Container height={containerHeight} position={position}>
      <KeyboardAvoidingView behavior="height" enabled={!!keyboardHeight}>
        <InnerWrapper {...props} insets={insets} />
      </KeyboardAvoidingView>
    </Container>
  );
}
