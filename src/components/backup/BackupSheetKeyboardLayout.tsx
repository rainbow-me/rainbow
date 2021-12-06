import { useRoute } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'react-native';
import { KeyboardArea } from 'react-native-keyboard-area';
import styled from 'styled-components';
import { RainbowButton } from '../buttons';
import { Column } from '../layout';
import { SheetHandleFixedToTopHeight } from '../sheet';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/keyboardTy... Remove this comment to see the full error message
import KeyboardTypes from '@rainbow-me/helpers/keyboardTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions, useKeyboardHeight } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation/config'... Remove this comment to see the full error message
import { sharedCoolModalTopOffset } from '@rainbow-me/navigation/config';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const Footer = styled(Column)`
  ${({ isTallPhone }) => padding(0, 15, isTallPhone ? 30 : 15)};
  flex-shrink: 0;
  width: 100%;
`;

const KeyboardSizeView = styled(KeyboardArea)`
  background-color: ${({ theme: { colors } }) => colors.transparent};
`;

export default function BackupSheetKeyboardLayout({
  children,
  footerButtonDisabled,
  footerButtonLabel,
  onSubmit,
  type,
}: any) {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'nativeScreen' does not exist on type '{}... Remove this comment to see the full error message
  const { params: { nativeScreen } = {} } = useRoute();
  const { height: deviceHeight, isTallPhone } = useDimensions();
  const keyboardHeight = useKeyboardHeight({
    keyboardType: KeyboardTypes.password,
  });

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column height={nativeScreen ? undefined : sheetRegionAboveKeyboardHeight}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <StatusBar barStyle="light-content" />
      {children}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Footer isTallPhone={isTallPhone}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RainbowButton
          disabled={footerButtonDisabled}
          label={footerButtonLabel}
          onPress={onSubmit}
        />
      </Footer>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      {android ? <KeyboardSizeView /> : null}
    </Column>
  );
}
