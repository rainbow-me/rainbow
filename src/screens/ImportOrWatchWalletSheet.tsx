import { Input } from '@/components/inputs';
import { SheetHandleFixedToTopHeight } from '@/components/sheet';
import { AccentColorProvider, Box, globalColors, Inset, Stack, Text, useForegroundColor, useTextStyle } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useImportingWallet, useKeyboardHeight } from '@/hooks';
import { colors } from '@/styles';
import React, { useCallback, useRef } from 'react';
import * as i18n from '@/languages';
import { ButtonPressAnimation } from '@/components/animations';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import { LoadingOverlay } from '@/components/modal';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Keyboard } from 'react-native';

const TRANSLATIONS = i18n.l.wallet.new.import_or_watch_wallet_sheet;

export const ImportOrWatchWalletSheet = () => {
  const { params: { type = 'watch' } = {} } = useRoute<RouteProp<RootStackParamList, typeof Routes.IMPORT_OR_WATCH_WALLET_SHEET>>();

  const { busy, handlePressImportButton, handleSetSeedPhrase, inputRef, isSecretValid, seedPhrase } = useImportingWallet();
  const keyboardHeight = useKeyboardHeight();

  const textStyle = useTextStyle({
    align: 'center',
    color: isSecretValid ? { custom: globalColors.purple60 } : 'label',
    size: '17pt / 135%',
    weight: 'semibold',
  });
  const labelTertiary = useForegroundColor('labelTertiary');
  const hasRefocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        // lower value than this seems to cause a bug where it de-focuses immediately
      }, 500);

      return () => {
        clearTimeout(timer);
        Keyboard.dismiss();
      };
    }, [inputRef])
  );

  const refocusOnce = () => {
    // given we are using rough timing, for slow devices we can ensure it doesn't de-focus here
    if (!hasRefocused.current) {
      hasRefocused.current = true;
      inputRef.current?.focus();
    }
  };

  const buttonDisabled = seedPhrase && !isSecretValid;

  return (
    <>
      <Box height="full" background="surfaceSecondary">
        <Box alignItems="center" justifyContent="space-between" paddingTop={{ custom: 38 }} paddingHorizontal="20px" testID="import-sheet">
          <Stack space="20px">
            <Text align="center" color="label" size="26pt" weight="bold">
              {i18n.t(TRANSLATIONS[type].title)}
            </Text>
            {type === 'import' && (
              <Text align="center" color="labelTertiary" size="15pt / 135%" weight="semibold">
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
            autoCapitalize="none"
            textContentType="none"
            enablesReturnKeyAutomatically
            onBlur={refocusOnce}
            keyboardType={IS_ANDROID ? 'visible-password' : 'default'}
            onChangeText={handleSetSeedPhrase}
            multiline
            numberOfLines={3}
            onSubmitEditing={() => {
              if (isSecretValid) handlePressImportButton({ type });
            }}
            placeholder={i18n.t(TRANSLATIONS[type].placeholder)}
            placeholderTextColor={labelTertiary}
            ref={inputRef}
            selectionColor={globalColors.purple60}
            scrollEnabled={false}
            spellCheck={false}
            returnKeyType="done"
            style={[textStyle, { width: 232 }]}
            testID="import-sheet-input"
            value={seedPhrase}
          />
        </Box>
        <Box position="absolute" right="0px" bottom={{ custom: keyboardHeight }}>
          <Inset bottom="20px" right="20px">
            <AccentColorProvider color={colors.alpha(globalColors.purple60, seedPhrase ? 1 : 0.1)}>
              <ButtonPressAnimation
                disabled={buttonDisabled}
                onPress={
                  seedPhrase
                    ? handlePressImportButton
                    : () => Clipboard.getString().then((text: string) => handleSetSeedPhrase(text.trim()))
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
                  shadow={seedPhrase && !buttonDisabled ? '12px accent' : undefined}
                  width={{ custom: 88 }}
                >
                  <Text
                    align="center"
                    color={
                      // eslint-disable-next-line no-nested-ternary
                      buttonDisabled ? 'labelSecondary' : seedPhrase ? 'label' : { custom: globalColors.purple60 }
                    }
                    size="15pt"
                    testID="import-sheet-button-label"
                    weight="bold"
                  >
                    {seedPhrase ? i18n.t(TRANSLATIONS.continue) : `􀉃 ${i18n.t(TRANSLATIONS.paste)}`}
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
