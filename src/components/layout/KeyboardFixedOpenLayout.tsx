import React, { ReactNode } from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/design-system';
import { KeyboardType } from '@/helpers/keyboardTypes';
import { useDimensions } from '@/hooks';

interface KeyboardFixedOpenLayoutProps {
  additionalPadding?: number;
  keyboardType?: KeyboardType;
  position?: 'absolute';
  children?: ReactNode;
}

export default function KeyboardFixedOpenLayout({
  additionalPadding = 0,
  keyboardType = KeyboardType.default,
  position = 'absolute',
  ...props
}: KeyboardFixedOpenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useDimensions();

  const adjustedScreenHeight = screenHeight - additionalPadding;

  return (
    <Box height={{ custom: adjustedScreenHeight }} left="0px" position={position} right="0px" top="0px">
      <KeyboardAvoidingView behavior="height">
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
