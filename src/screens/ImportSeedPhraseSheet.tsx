import { Input } from '@/components/inputs';
import { SlackSheet } from '@/components/sheet';
import {
  AccentColorProvider,
  Box,
  DebugLayout,
  globalColors,
  Text,
  useForegroundColor,
  useTextStyle,
} from '@/design-system';
import { IS_ANDROID, IS_TEST } from '@/env';
import { useImportingWallet, useKeyboardHeight } from '@/hooks';
import { colors } from '@/styles';
import React, { useMemo } from 'react';
import * as i18n from '@/languages';

export const ImportSeedPhraseSheet = () => {
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

  console.log(keyboardHeight);

  return (
    <SlackSheet
      contentHeight="100%"
      backgroundColor={globalColors.blueGrey10}
      scrollEnabled={false}
      height="100%"
      deferredHeight={IS_ANDROID}
      testID="import-sheet"
    >
      <DebugLayout>
        <Box alignItems="center" height="full" paddingTop={{ custom: 38 }}>
          <Box height={{ custom: 68 }} justifyContent="space-between">
            <Text color="label" size="26pt" weight="bold">
              Watch an address
            </Text>
          </Box>
          <DebugLayout>
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
              style={useMemo(
                () => ({
                  ...textStyle,
                  paddingTop: 99,
                }),
                [textStyle]
              )}
              testID="import-sheet-input"
              value={seedPhrase}
            />
          </DebugLayout>

          {/* {seedPhrase ? (busy && !IS_TEST ? () : ()) : ()} */}
          <AccentColorProvider color={colors.alpha(globalColors.purple60, 1)}>
            <Box
              background="accent"
              position="absolute"
              height="36px"
              width={{ custom: 88 }}
              right="0px"
              bottom={{ custom: keyboardHeight }}
            >
              <Text size="15pt / 135%">hi</Text>
            </Box>
          </AccentColorProvider>
        </Box>
      </DebugLayout>
    </SlackSheet>
  );
};
