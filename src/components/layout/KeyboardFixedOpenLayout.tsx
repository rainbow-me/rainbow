import React, { ReactNode } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/design-system';
import { KeyboardType } from '@/helpers/keyboardTypes';
import { useDimensions, useKeyboardHeight } from '@/hooks';
import { IS_ANDROID } from '@/env';

interface KeyboardFixedOpenLayoutProps {
  additionalPadding?: number;
  keyboardType?: KeyboardType;
  position?: 'absolute';
  children?: ReactNode;
}

export default function KeyboardFixedOpenLayout({
  additionalPadding = 0,
  keyboardType = KeyboardType.default,
  position = IS_ANDROID ? undefined : 'absolute',
  ...props
}: KeyboardFixedOpenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight({ keyboardType });

  const containerHeight = screenHeight - keyboardHeight - additionalPadding;

  return (
    <Box height={{ custom: containerHeight }} left="0px" position={position} right="0px" top="0px">
      {/* 
        Android fix: KeyboardAvoidingView causes flickering when keyboard animates.
        The height recalculation fights with the keyboard animation.
      */}
      <KeyboardAvoidingView behavior={IS_ANDROID ? undefined : 'height'} enabled={!IS_ANDROID && !!keyboardHeight}>
        <Box
          alignItems="center"
          height="full"
          justifyContent="center"
          paddingBottom="10px"
          paddingTop={{ custom: insets.top }}
          width="full"
          {...props}
        />
      </KeyboardAvoidingView>
    </Box>
  );
}
