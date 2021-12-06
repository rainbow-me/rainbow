import React, { useCallback, useMemo } from 'react';
import { StatusBar } from 'react-native';
import { KeyboardArea } from 'react-native-keyboard-area';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/ActivityIndicator' was resol... Remove this comment to see the full error message
import ActivityIndicator from '../components/ActivityIndicator';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Spinner' was resolved to '/U... Remove this comment to see the full error message
import Spinner from '../components/Spinner';
import { MiniButton } from '../components/buttons';
import { Input } from '../components/inputs';
import { Centered, Column, Row } from '../components/layout';
import { SheetHandle } from '../components/sheet';
import { Text } from '../components/text';
import {
  InvalidPasteToast,
  ToastPositionContainer,
} from '../components/toasts';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../context/ThemeContext' was resolved to '... Remove this comment to see the full error message
import { useTheme } from '../context/ThemeContext';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/isNativeSt... Remove this comment to see the full error message
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/validators... Remove this comment to see the full error message
import { isValidWallet } from '@rainbow-me/helpers/validators';
import {
  useAccountSettings,
  useClipboard,
  useDimensions,
  useImportingWallet,
  useInvalidPaste,
  useKeyboardHeight,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation/effects... Remove this comment to see the full error message
import { sheetVerticalOffset } from '@rainbow-me/navigation/effects';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders, padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { deviceUtils } from '@rainbow-me/utils';

const sheetBottomPadding = 19;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Container = styled.View`
  flex: 1;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  padding-top: ${android
    ? 0
    : isNativeStackAvailable
    ? 0
    : sheetVerticalOffset};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android ? `margin-top: ${sheetVerticalOffset};` : ''}
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android
    ? `background-color: ${({ theme: { colors } }: any) => colors.transparent};`
    : ''}
`;

const Footer = styled(Row).attrs({
  align: 'start',
  justify: 'end',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  bottom: ${android ? 15 : 0};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  position: ${android ? 'absolute' : 'relative'};
  right: 0;
  width: 100%;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android
    ? `top: ${({ isSmallPhone }: any) =>
        isSmallPhone ? sheetBottomPadding * 2 : 0};`
    : ``}
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android ? 'margin-right: 18;' : ''}
`;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs({
  color: 'white',
  size: 15,
})`
  margin-right: 5;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-top: ${android ? 0 : 2};
`;

const FooterButton = styled(MiniButton).attrs({
  testID: 'import-sheet-button',
})``;

const KeyboardSizeView = styled(KeyboardArea)`
  background-color: ${({ theme: { colors } }) => colors.white};
`;

const SecretTextArea = styled(Input).attrs({
  align: 'center',
  autoCapitalize: 'none',
  autoCorrect: false,
  autoFocus: true,
  enablesReturnKeyAutomatically: true,
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  keyboardType: android ? 'visible-password' : 'default',
  lineHeight: 'looser',
  multiline: true,
  numberOfLines: 3,
  placeholder: 'Secret phrase, private key, Ethereum address, or ENS name',
  returnKeyType: 'done',
  size: 'large',
  spellCheck: false,
  weight: 'semibold',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-bottom: ${android ? 55 : 0};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  min-height: ${android ? 100 : 50};
  width: 100%;
`;

const SecretTextAreaContainer = styled(Centered)`
  ${padding(0, 42)};
  flex: 1;
`;

const Sheet = styled(Column).attrs({
  align: 'center',
  flex: 1,
})`
  ${borders.buildRadius('top', isNativeStackAvailable ? 0 : 16)};
  ${padding(0, 15, sheetBottomPadding)};
  background-color: ${({ theme: { colors } }) => colors.white};
  z-index: 1;
`;

export default function ImportSeedPhraseSheet() {
  const { isSmallPhone } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
  const {
    busy,
    handleFocus,
    handlePressImportButton,
    handleSetSeedPhrase,
    inputRef,
    isSecretValid,
    seedPhrase,
  } = useImportingWallet();

  const { accountAddress } = useAccountSettings();

  const { getClipboard, hasClipboardData, clipboard } = useClipboard();
  const { onInvalidPaste } = useInvalidPaste();

  const isClipboardValidSecret = useMemo(
    () =>
      deviceUtils.isIOS14
        ? hasClipboardData
        : clipboard !== accountAddress && isValidWallet(clipboard),
    [accountAddress, clipboard, hasClipboardData]
  );

  const handlePressPasteButton = useCallback(() => {
    if (deviceUtils.isIOS14 && !hasClipboardData) return;
    getClipboard((result: any) => {
      if (result !== accountAddress && isValidWallet(result)) {
        return handleSetSeedPhrase(result);
      }
      return onInvalidPaste();
    });
  }, [
    accountAddress,
    getClipboard,
    handleSetSeedPhrase,
    hasClipboardData,
    onInvalidPaste,
  ]);

  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container testID="import-sheet">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <StatusBar barStyle="light-content" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Sheet>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SheetHandle marginBottom={7} marginTop={6} />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text size="large" weight="bold">
          Add Wallet
        </Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SecretTextAreaContainer>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SecretTextArea
            color={isSecretValid ? colors.appleBlue : colors.dark}
            onChangeText={handleSetSeedPhrase}
            onFocus={handleFocus}
            onSubmitEditing={handlePressImportButton}
            placeholder="Secret phrase, private key, Ethereum address or ENS name"
            placeholderTextColor={colors.alpha(colors.blueGreyDark, 0.3)}
            ref={inputRef}
            returnKeyType="done"
            size="large"
            spellCheck={false}
            testID="import-sheet-input"
            value={seedPhrase}
          />
        </SecretTextAreaContainer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Footer isSmallPhone={isSmallPhone}>
          {seedPhrase ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <FooterButton
              disabled={!isSecretValid}
              hasLeadingIcon
              // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
              {...(android && { height: 30, overflowMargin: 15, width: 89 })}
              onPress={handlePressImportButton}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Row>
                {busy ? (
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <LoadingSpinner />
                ) : (
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Text align="center" color="whiteLabel" weight="bold">
                    􀂍{' '}
                  </Text>
                )}
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text
                  align="center"
                  color="whiteLabel"
                  testID="import-sheet-button-label"
                  weight="bold"
                >
                  Import
                </Text>
              </Row>
            </FooterButton>
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <FooterButton
              // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
              {...(android && { height: 30, overflowMargin: 15, width: 63 })}
              disabled={!isClipboardValidSecret}
              onPress={handlePressPasteButton}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text
                align="center"
                color="whiteLabel"
                testID="import-sheet-button-label"
                weight="bold"
              >
                Paste
              </Text>
            </FooterButton>
          )}
        </Footer>
      </Sheet>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ToastPositionContainer bottom={keyboardHeight}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <InvalidPasteToast />
      </ToastPositionContainer>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios ? <KeyboardSizeView isOpen /> : null}
    </Container>
  );
}
