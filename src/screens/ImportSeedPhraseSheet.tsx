import { Input } from '@/components/inputs';
import { SheetHandleFixedToTopHeight, SlackSheet } from '@/components/sheet';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  globalColors,
  Inset,
  Stack,
  Text,
  useForegroundColor,
  useTextStyle,
} from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useDimensions, useImportingWallet, useKeyboardHeight } from '@/hooks';
import { colors } from '@/styles';
import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, StatusBar } from 'react-native';
import * as i18n from '@/languages';
import { ButtonPressAnimation } from '@/components/animations';
import { RouteProp, useRoute } from '@react-navigation/core';
import Clipboard from '@react-native-community/clipboard';
import { LoadingOverlay } from '@/components/modal';

const TRANSLATIONS = i18n.l.wallet.new.import_seed_phrase_sheet;

type RouteParams = {
  ImportSeedPhraseSheetParams: {
    // watch_or_import type is temporary, will be removed in followup PR
    type: 'watch' | 'import' | 'watch_or_import';
  };
};

export const ImportSeedPhraseSheet: React.FC = () => {
  const { params: { type = 'watch_or_import' } = {} } = useRoute<
    RouteProp<RouteParams, 'ImportSeedPhraseSheetParams'>
  >();

  const {
    busy,
    handleFocus,
    handlePressImportButton,
    handleSetSeedPhrase,
    inputRef,
    isSecretValid,
    seedPhrase,
  } = useImportingWallet();
  const { height: deviceHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();

  const textStyle = useTextStyle({
    align: 'center',
    color: isSecretValid ? { custom: globalColors.purple60 } : 'label',
    size: '17pt / 135%',
    weight: 'semibold',
  });
  const labelTertiary = useForegroundColor('labelTertiary');

  const [keyboardVisible, setKeyboardVisibility] = useState(true);

  useEffect(() => {
    const keyboardShownSubscription = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisibility(true);
      }
    );
    const keyboardDismissedSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisibility(false);
      }
    );
    return () => {
      keyboardShownSubscription.remove();
      keyboardDismissedSubscription.remove();
    };
  }, []);

  const buttonDisabled = seedPhrase && !isSecretValid;

  const contentHeight = deviceHeight - SheetHandleFixedToTopHeight;

  const bottomOffset = IS_ANDROID && keyboardVisible ? 0 : keyboardHeight;

  return (
    <>
      <BackgroundProvider color="surfaceSecondary">
        {({ backgroundColor }) => (
          // @ts-expect-error js component
          <SlackSheet
            additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
            contentHeight={contentHeight}
            backgroundColor={backgroundColor}
            scrollEnabled={false}
            height="100%"
            testID="import-sheet"
          >
            <Box
              alignItems="center"
              justifyContent="space-between"
              paddingTop={{ custom: 38 }}
              paddingHorizontal="20px"
            >
              <Stack space="20px">
                <Text align="center" color="label" size="26pt" weight="bold">
                  {i18n.t(TRANSLATIONS[type].title)}
                </Text>
                {type === 'import' && (
                  <Text
                    align="center"
                    color="labelTertiary"
                    size="15pt / 135%"
                    weight="semibold"
                  >
                    {i18n.t(TRANSLATIONS.import.description)}
                  </Text>
                )}
              </Stack>
            </Box>
          </SlackSheet>
        )}
      </BackgroundProvider>
      <Box
        alignItems="center"
        bottom={{ custom: bottomOffset }}
        justifyContent="center"
        position="absolute"
        top="0px"
        width="full"
      >
        <Input
          autoCorrect={false}
          autoCompleteType={false}
          autoFocus
          autoCapitalize="none"
          textContentType="none"
          enablesReturnKeyAutomatically
          keyboardType={IS_ANDROID ? 'visible-password' : 'default'}
          onChangeText={handleSetSeedPhrase}
          onFocus={handleFocus}
          multiline
          numberOfLines={3}
          onSubmitEditing={() => {
            // @ts-expect-error callback needs refactor
            if (isSecretValid) handlePressImportButton();
          }}
          placeholder={i18n.t(TRANSLATIONS[type].placeholder)}
          placeholderTextColor={labelTertiary}
          ref={inputRef}
          selectionColor={globalColors.purple60}
          spellCheck={false}
          width={232}
          returnKeyType="done"
          style={textStyle}
          testID="import-sheet-input"
          value={seedPhrase}
        />
      </Box>
      <Box position="absolute" right="0px" bottom={{ custom: bottomOffset }}>
        <Inset bottom="20px" right="20px">
          <AccentColorProvider
            color={colors.alpha(globalColors.purple60, seedPhrase ? 1 : 0.1)}
          >
            <ButtonPressAnimation
              disabled={buttonDisabled}
              onPress={
                seedPhrase
                  ? handlePressImportButton
                  : () =>
                      Clipboard.getString().then((text: string) =>
                        handleSetSeedPhrase(text)
                      )
              }
              overflowMargin={50}
              testID="import-sheet-button"
            >
              <Box
                alignItems="center"
                background={buttonDisabled ? 'fillSecondary' : 'accent'}
                borderRadius={99}
                height="36px"
                justifyContent="center"
                shadow={
                  seedPhrase && !buttonDisabled ? '12px accent' : undefined
                }
                width={{ custom: 88 }}
              >
                <Text
                  align="center"
                  color={
                    // eslint-disable-next-line no-nested-ternary
                    buttonDisabled
                      ? 'labelSecondary'
                      : seedPhrase
                      ? 'label'
                      : { custom: globalColors.purple60 }
                  }
                  size="15pt"
                  testID="import-sheet-button-label"
                  weight="bold"
                >
                  {seedPhrase
                    ? i18n.t(TRANSLATIONS.continue)
                    : `􀉃 ${i18n.t(TRANSLATIONS.paste)}`}
                </Text>
              </Box>
            </ButtonPressAnimation>
          </AccentColorProvider>
        </Inset>
      </Box>
      {busy && <LoadingOverlay />}
    </>
  );
};
