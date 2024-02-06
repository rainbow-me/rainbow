import { Input } from '@/components/inputs';
import { SheetHandleFixedToTopHeight } from '@/components/sheet';
import {
  AccentColorProvider,
  Box,
  globalColors,
  Inset,
  Stack,
  Text,
  useForegroundColor,
  useTextStyle,
} from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useImportingWallet, useKeyboardHeight } from '@/hooks';
import { colors } from '@/styles';
import React, { useCallback } from 'react';
import * as i18n from '@/languages';
import { ButtonPressAnimation } from '@/components/animations';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import Clipboard from '@react-native-community/clipboard';
import { LoadingOverlay } from '@/components/modal';

const TRANSLATIONS = i18n.l.wallet.new.import_or_watch_wallet_sheet;

export type ImportOrWatchWalletSheetParams = {
  type: 'watch' | 'import';
};

type RouteParams = {
  ImportOrWatchWalletSheetParams: ImportOrWatchWalletSheetParams;
};

export const ImportOrWatchWalletSheet = () => {
  const { params: { type = 'watch' } = {} } = useRoute<
    RouteProp<RouteParams, 'ImportOrWatchWalletSheetParams'>
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
  const keyboardHeight = useKeyboardHeight();

  const textStyle = useTextStyle({
    align: 'center',
    color: isSecretValid ? { custom: globalColors.purple60 } : 'label',
    size: '17pt / 135%',
    weight: 'semibold',
  });
  const labelTertiary = useForegroundColor('labelTertiary');

  useFocusEffect(useCallback(() => inputRef.current?.focus(), [inputRef]));

  const buttonDisabled = seedPhrase && !isSecretValid;

  return (
    <>
      <Box height="full" background="surfaceSecondary">
        <Box
          alignItems="center"
          justifyContent="space-between"
          paddingTop={{ custom: 38 }}
          paddingHorizontal="20px"
          testID="import-sheet"
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
        <Box
          alignItems="center"
          bottom={{ custom: keyboardHeight }}
          justifyContent="center"
          position="absolute"
          top={{ custom: -SheetHandleFixedToTopHeight }}
          width="full"
        >
          <Input
            autoCorrect={false}
            autoCompleteType={false}
            autoFocus={false}
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
            scrollEnabled={false}
            spellCheck={false}
            width={232}
            returnKeyType="done"
            style={textStyle}
            testID="import-sheet-input"
            value={seedPhrase}
          />
        </Box>
        <Box
          position="absolute"
          right="0px"
          bottom={{ custom: keyboardHeight }}
        >
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
      </Box>
    </>
  );
};
