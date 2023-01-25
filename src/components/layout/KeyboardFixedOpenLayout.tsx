import React, { ReactNode } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/design-system';
import { KeyboardType } from '@/helpers/keyboardTypes';
import { useDimensions, useKeyboardHeight } from '@/hooks';

interface KeyboardFixedOpenLayoutProps {
  additionalPadding?: number;
  keyboardType?: KeyboardType;
  position?: 'absolute';
  children?: ReactNode;
}

export default function KeyboardFixedOpenLayout({
  additionalPadding = 0,
  keyboardType = KeyboardType.default,
  position = android ? undefined : 'absolute',
  ...props
}: KeyboardFixedOpenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight({ keyboardType });

  const containerHeight = screenHeight - keyboardHeight - additionalPadding;

  return (
    <Box
      height={containerHeight}
      left={0}
      position={position}
      right={0}
      top={0}
    >
      <KeyboardAvoidingView behavior="height" enabled={!!keyboardHeight}>
        <Box
          alignItems="center"
          height="full"
          justifyContent="center"
          paddingBottom={10}
          paddingTop={insets.top}
          width="full"
          {...props}
        />
      </KeyboardAvoidingView>
    </Box>
  );
}
