import React, { useCallback, useMemo } from 'react';
import { StatusBar } from 'react-native';
import { KeyboardArea } from 'react-native-keyboard-area';
import styled from 'styled-components';
import ActivityIndicator from '../components/ActivityIndicator';
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
import { useTheme } from '../context/ThemeContext';
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
import { isValidWallet } from '@rainbow-me/helpers/validators';
import {
  useAccountSettings,
  useClipboard,
  useDimensions,
  useImportingWallet,
  useInvalidPaste,
  useKeyboardHeight,
} from '@rainbow-me/hooks';
import { sheetVerticalOffset } from '@rainbow-me/navigation/effects';
import { borders, padding } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';

const sheetBottomPadding = 19;

const Container = styled.View`
  flex: 1;
  padding-top: ${android
    ? 0
    : isNativeStackAvailable
    ? 0
    : sheetVerticalOffset};
  ${android ? `margin-top: ${sheetVerticalOffset};` : ''}
  ${android
    ? `background-color: ${({ theme: { colors } }) => colors.transparent};`
    : ''}
`;

const Footer = styled(Row).attrs({
  align: 'start',
  justify: 'end',
})`
  bottom: ${android ? 15 : 0};
  position: ${android ? 'absolute' : 'relative'};
  right: 0;
  width: 100%;
  ${android
    ? `top: ${({ isSmallPhone }) =>
        isSmallPhone ? sheetBottomPadding * 2 : 0};`
    : ``}
  ${android ? 'margin-right: 18;' : ''}
`;

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs({
  color: 'white',
  size: 15,
})`
  margin-right: 5;
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
  margin-bottom: ${android ? 55 : 0};
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
    getClipboard(result => {
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
    <Container testID="import-sheet">
      <StatusBar barStyle="light-content" />
      <Sheet>
        <SheetHandle marginBottom={7} marginTop={6} />
        <Text size="large" weight="bold">
          Add Wallet
        </Text>
        <SecretTextAreaContainer>
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
        <Footer isSmallPhone={isSmallPhone}>
          {seedPhrase ? (
            <FooterButton
              disabled={!isSecretValid}
              hasLeadingIcon
              {...(android && { height: 30, overflowMargin: 15, width: 89 })}
              onPress={handlePressImportButton}
            >
              <Row>
                {busy ? (
                  <LoadingSpinner />
                ) : (
                  <Text align="center" color="whiteLabel" weight="bold">
                    􀂍{' '}
                  </Text>
                )}
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
            <FooterButton
              {...(android && { height: 30, overflowMargin: 15, width: 63 })}
              disabled={!isClipboardValidSecret}
              onPress={handlePressPasteButton}
            >
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
      <ToastPositionContainer bottom={keyboardHeight}>
        <InvalidPasteToast />
      </ToastPositionContainer>
      {ios ? <KeyboardSizeView isOpen /> : null}
    </Container>
  );
}
