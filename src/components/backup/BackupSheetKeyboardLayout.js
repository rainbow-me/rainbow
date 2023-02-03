import { useRoute } from '@react-navigation/native';
import React from 'react';
import { KeyboardArea } from 'react-native-keyboard-area';
import { RainbowButton } from '../buttons';
import { Column } from '../layout';
import { SheetHandleFixedToTopHeight } from '../sheet';
import KeyboardTypes from '@/helpers/keyboardTypes';
import { useDimensions, useKeyboardHeight } from '@/hooks';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import styled from '@/styled-thing';
import { padding } from '@/styles';

const Footer = styled(Column)(({ isTallPhone }) => ({
  ...padding.object(20, 15, isTallPhone ? 65 : 50),
  flexShrink: 0,
  width: '100%',
}));

const KeyboardSizeView = styled(KeyboardArea)({
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
});

export default function BackupSheetKeyboardLayout({
  children,
  footerButtonDisabled,
  footerButtonLabel,
  onSubmit,
  type,
}) {
  const { params: { nativeScreen } = {} } = useRoute();
  const { height: deviceHeight, isTallPhone } = useDimensions();
  const keyboardHeight = useKeyboardHeight({
    keyboardType: KeyboardTypes.password,
  });

  const platformKeyboardHeight = android
    ? type === 'restore'
      ? -10
      : -30
    : keyboardHeight;

  const sheetRegionAboveKeyboardHeight =
    deviceHeight -
    platformKeyboardHeight -
    sharedCoolModalTopOffset -
    SheetHandleFixedToTopHeight;

  return (
    <Column height={nativeScreen ? undefined : sheetRegionAboveKeyboardHeight}>
      {children}
      <Footer isTallPhone={isTallPhone}>
        <RainbowButton
          disabled={footerButtonDisabled}
          label={footerButtonLabel}
          onPress={onSubmit}
        />
      </Footer>
      {android ? <KeyboardSizeView /> : null}
    </Column>
  );
}
