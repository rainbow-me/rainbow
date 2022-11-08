import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { KeyboardArea } from 'react-native-keyboard-area';
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
import { useTheme } from '../theme/ThemeContext';
import { isValidWallet } from '@/helpers/validators';
import {
  useAccountSettings,
  useClipboard,
  useDimensions,
  useImportingWallet,
  useInvalidPaste,
  useKeyboardHeight,
} from '@/hooks';
import { sheetVerticalOffset } from '@/navigation/effects';
import styled from '@/styled-thing';
import { borders, padding } from '@/styles';
import { deviceUtils } from '@/utils';
import { IS_ANDROID, IS_IOS, IS_TEST } from '@/env';

const sheetBottomPadding = 19;

const Container = styled.View({
  flex: 1,
  paddingTop: 0,

  ...(IS_ANDROID
    ? {
        backgroundColor: ({ theme: { colors } }) => colors.transparent,
        marginTop: sheetVerticalOffset,
      }
    : {}),
});

const Footer = styled(Row).attrs({
  align: 'start',
  justify: 'end',
})({
  bottom: 0,
  position: 'relative',
  right: 0,
  width: '100%',
  ...(IS_ANDROID
    ? {
        marginRight: 18,
        top: ({ isSmallPhone }) => (isSmallPhone ? sheetBottomPadding * 2 : 0),
      }
    : {}),
});

const LoadingSpinner = styled(IS_ANDROID ? Spinner : ActivityIndicator).attrs({
  color: 'white',
  size: 15,
})({
  marginRight: 5,
  marginTop: IS_ANDROID ? 0 : 2,
});

const FooterButton = styled(MiniButton).attrs({
  testID: 'import-sheet-button',
})({});

const KeyboardSizeView = styled(KeyboardArea)({
  backgroundColor: ({ theme: { colors } }) => colors.white,
});
const placeholder = lang.t('wallet.new.enter_seeds_placeholder');

const SecretTextArea = styled(Input).attrs({
  align: 'center',
  autoCapitalize: 'none',
  autoComplete: 'off',
  autoCorrect: false,
  autoFocus: true,
  dataDetectorTypes: 'none',
  enablesReturnKeyAutomatically: true,
  keyboardType: IS_ANDROID ? 'visible-password' : 'default',
  lineHeight: 'looser',
  multiline: true,
  numberOfLines: 3,
  placeholder,
  returnKeyType: 'done',
  size: 'large',
  spellCheck: false,
  textContentType: 'none',
  weight: 'semibold',
})({
  marginBottom: IS_ANDROID ? 55 : 0,
  minHeight: IS_ANDROID ? 100 : 50,
  width: '100%',
});

const SecretTextAreaContainer = styled(Centered)({
  ...padding.object(0, 42),
  flex: 1,
});

const Sheet = styled(Column).attrs({
  align: 'center',
  flex: 1,
})({
  ...borders.buildRadiusAsObject('top', IS_IOS ? 0 : 16),
  ...padding.object(0, 15, sheetBottomPadding),
  backgroundColor: ({ theme: { colors } }) => colors.white,
  zIndex: 1,
});

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
      <Sheet>
        <SheetHandle marginBottom={7} marginTop={6} />
        <Text size="large" weight="bold">
          {lang.t('wallet.action.import_wallet')}
        </Text>
        <SecretTextAreaContainer>
          <SecretTextArea
            color={isSecretValid ? colors.appleBlue : colors.dark}
            onChangeText={handleSetSeedPhrase}
            onFocus={handleFocus}
            onSubmitEditing={handlePressImportButton}
            placeholder={lang.t('wallet.new.enter_seeds_placeholder')}
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
              {...(IS_ANDROID && { height: 30, overflowMargin: 15, width: 89 })}
              onPress={handlePressImportButton}
            >
              <Row>
                {busy && !IS_TEST ? (
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
                  {lang.t('button.import')}
                </Text>
              </Row>
            </FooterButton>
          ) : (
            <FooterButton
              {...(IS_ANDROID && { height: 30, overflowMargin: 15, width: 63 })}
              disabled={!isClipboardValidSecret}
              onPress={handlePressPasteButton}
            >
              <Text
                align="center"
                color="whiteLabel"
                testID="import-sheet-button-label"
                weight="bold"
              >
                {lang.t('button.paste_seed_phrase')}
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
