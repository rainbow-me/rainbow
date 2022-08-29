import React from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import Centered from './Centered';
import keyboardTypes from '@/helpers/keyboardTypes';
import { useDimensions, useKeyboardHeight } from '@/hooks';
import styled from '@/styled-thing';
import { position } from '@/styles';

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
  keyboardType = keyboardTypes.default,
  position = android ? 'relative' : 'absolute',
  ...props
}) {
  const insets = useSafeArea();
  const { height: screenHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight({ keyboardType });

  const containerHeight = screenHeight - keyboardHeight - additionalPadding;

  return (
    <Container height={containerHeight} position={position}>
      <KeyboardAvoidingView behavior="height" enabled={!!keyboardHeight}>
        <InnerWrapper {...props} insets={insets} />
      </KeyboardAvoidingView>
    </Container>
  );
}
