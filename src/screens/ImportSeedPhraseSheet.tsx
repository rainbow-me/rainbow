import { Input } from '@/components/inputs';
import { SheetHandleFixedToTopHeight, SlackSheet } from '@/components/sheet';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  ColorModeProvider,
  DebugLayout,
  globalColors,
  Inset,
  Stack,
  Text,
  useForegroundColor,
  useTextStyle,
} from '@/design-system';
import { IS_ANDROID, IS_TEST } from '@/env';
import {
  useAccountSettings,
  useClipboard,
  useDimensions,
  useImportingWallet,
  useKeyboardHeight,
} from '@/hooks';
import { colors } from '@/styles';
import React, { useEffect, useMemo, useState } from 'react';
import * as i18n from '@/languages';
import { deviceUtils } from '@/utils';
import { ButtonPressAnimation } from '@/components/animations';
import { RouteProp, useRoute } from '@react-navigation/core';
import { isValidWallet } from '@/helpers/validators';
import Clipboard from '@react-native-community/clipboard';
import { delay } from '@/helpers/utilities';

type RouteParams = {
  ImportSeedPhraseSheetParams: {
    type: 'watch' | 'import';
  };
};

export const ImportSeedPhraseSheet: React.FC = () => {
  const { params: { type } = {} } = useRoute<
    RouteProp<RouteParams, 'ImportSeedPhraseSheetParams'>
  >();

  const {
    busy,
    handleFocus,
    handlePressImportButton,
    handleSetSeedPhrase,
    inputRef,
    isInputValid,
    isImportable,
    isWatchable,
    seedPhrase,
  } = useImportingWallet();

  const [copiedText, setCopiedText] = useState('');

  // const { clipboard } = useClipboard();
  const { accountAddress } = useAccountSettings();

  const isClipboardValidSecret = useMemo(
    () => copiedText !== accountAddress && isValidWallet(copiedText),
    [accountAddress, copiedText]
  );

  useEffect(() => {
    const refreshClipboard = async () => {
      while (!seedPhrase) {
        // eslint-disable-next-line no-await-in-loop
        const text = await Clipboard.getString();
        setCopiedText(text);
        delay(1000);
      }
    };
    refreshClipboard();
  }, [seedPhrase]);

  const { height: deviceHeight } = useDimensions();

  const keyboardHeight = useKeyboardHeight();

  const textStyle = useTextStyle({
    align: 'center',
    color: isInputValid ? { custom: globalColors.purple60 } : 'label',
    size: '17pt / 135%',
    weight: 'semibold',
  });

  const labelSecondary = useForegroundColor('labelSecondary');
  const labelTertiary = useForegroundColor('labelTertiary');

  const shouldWarn = type === 'watch' ? isImportable : isWatchable;

  let buttonText;
  if (seedPhrase) {
    buttonText = type === 'watch' ? '􀨭 Watch' : '􀂍 Import';
  } else {
    buttonText = '􀉃 Paste';
  }

  const buttonDisabled = seedPhrase ? !isInputValid : !isClipboardValidSecret;

  return (
    <>
      <BackgroundProvider color="surfaceSecondary">
        {({ backgroundColor }) => (
          <SlackSheet
            contentHeight={deviceHeight - SheetHandleFixedToTopHeight}
            backgroundColor={backgroundColor}
            scrollEnabled={false}
            height="100%"
            deferredHeight={IS_ANDROID}
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
                  {type === 'watch' ? 'Watch an address' : 'Restore a wallet'}
                </Text>
                {type === 'import' && (
                  <Text
                    align="center"
                    color="labelTertiary"
                    size="15pt / 135%"
                    weight="semibold"
                  >
                    Restore with a recovery phrase or private key from Rainbow
                    or another crypto wallet.
                  </Text>
                )}
              </Stack>
            </Box>
          </SlackSheet>
        )}
      </BackgroundProvider>
      <Box
        alignItems="center"
        bottom={{ custom: keyboardHeight }}
        justifyContent="center"
        position="absolute"
        top="0px"
        width="full"
      >
        <Input
          autoCorrect={false}
          autoComplete={false}
          autoFocus
          autoCapitalize="none"
          textContentType="none"
          enablesReturnKeyAutomatically
          keyboardType={IS_ANDROID ? 'visible-password' : 'default'}
          onChangeText={handleSetSeedPhrase}
          onFocus={handleFocus}
          multiline
          numberOfLines={3}
          onSubmitEditing={handlePressImportButton}
          placeholder={i18n.t(i18n.l.wallet.new.enter_seeds_placeholder)}
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
      <Box position="absolute" right="0px" bottom={{ custom: keyboardHeight }}>
        <Inset bottom="20px" right="20px">
          <AccentColorProvider
            color={colors.alpha(globalColors.purple60, seedPhrase ? 1 : 0.1)}
          >
            <Box
              alignItems="center"
              as={ButtonPressAnimation}
              background="accent"
              borderRadius={99}
              disabled={buttonDisabled}
              height="36px"
              justifyContent="center"
              onPress={
                seedPhrase
                  ? handlePressImportButton
                  : () => handleSetSeedPhrase(copiedText)
              }
              shadow={seedPhrase ? '12px accent' : undefined}
              width={{ custom: 88 }}
            >
              <Text
                align="center"
                color={seedPhrase ? 'label' : { custom: globalColors.purple60 }}
                size="15pt"
                weight="bold"
              >
                {seedPhrase ? 'Continue' : '􀉃 Paste'}
              </Text>
            </Box>
          </AccentColorProvider>
        </Inset>
      </Box>
    </>
  );
};
