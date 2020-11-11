import { useRoute } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'react-native';
import styled from 'styled-components';
import { RainbowButton } from '../buttons';
import { Column } from '../layout';
import { SheetHandleFixedToTopHeight } from '../sheet';
import KeyboardTypes from '@rainbow-me/helpers/keyboardTypes';
import { useDimensions, useKeyboardHeight } from '@rainbow-me/hooks';
import { sharedCoolModalTopOffset } from '@rainbow-me/navigation/config';
import { padding } from '@rainbow-me/styles';

const Footer = styled(Column)`
  ${({ isTallPhone }) => padding(0, 15, isTallPhone ? 30 : 15)};
  flex-shrink: 0;
  width: 100%;
`;

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
      <StatusBar barStyle="light-content" />
      {children}
      <Footer isTallPhone={isTallPhone}>
        <RainbowButton
          disabled={footerButtonDisabled}
          label={footerButtonLabel}
          onPress={onSubmit}
        />
      </Footer>
    </Column>
  );
}
