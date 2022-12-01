import { Input } from '@/components/inputs';
import { SlackSheet } from '@/components/sheet';
import {
  Box,
  DebugLayout,
  globalColors,
  Text,
  useForegroundColor,
  useTextStyle,
} from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useImportingWallet } from '@/hooks';
import { colors } from '@/styles';
import React, { useMemo } from 'react';
import * as i18n from '@/languages';

export const ImportWalletSheet = () => {
  const {
    busy,
    handleFocus,
    handlePressImportButton,
    handleSetSeedPhrase,
    inputRef,
    isSecretValid,
    seedPhrase,
  } = useImportingWallet();

  const textStyle = useTextStyle({
    align: 'center',
    color: isSecretValid ? { custom: globalColors.purple60 } : 'label',
    size: '17pt / 135%',
    weight: 'semibold',
  });

  const labelTertiary = useForegroundColor('labelTertiary');

  return (
    <SlackSheet
      contentHeight="100%"
      backgroundColor={globalColors.blueGrey10}
      scrollEnabled={false}
      height="100%"
      deferredHeight={IS_ANDROID}
      testID="import-sheet"
    >
      <Box alignItems="center" paddingTop={{ custom: 38 }}>
        <Box height={{ custom: 68 }} justifyContent="space-between">
          <Text color="label" size="26pt" weight="bold">
            Watch an address
          </Text>
        </Box>
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
          selectionColor={colors.alpha(globalColors.purple60, 10)}
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
      </Box>
    </SlackSheet>
  );
};
