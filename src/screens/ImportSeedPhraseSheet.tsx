import { Input } from '@/components/inputs';
import { SheetHandleFixedToTopHeight, SlackSheet } from '@/components/sheet';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  DebugLayout,
  globalColors,
  Inset,
  Stack,
  Text,
  useForegroundColor,
  useTextStyle,
} from '@/design-system';
import { IS_ANDROID, IS_TEST } from '@/env';
import { useDimensions, useImportingWallet, useKeyboardHeight } from '@/hooks';
import { colors } from '@/styles';
import React, { useMemo } from 'react';
import * as i18n from '@/languages';
import { deviceUtils } from '@/utils';
import { ButtonPressAnimation } from '@/components/animations';
import { RouteProp, useRoute } from '@react-navigation/core';

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

  const { height: deviceHeight } = useDimensions();

  const keyboardHeight = useKeyboardHeight();

  const textStyle = useTextStyle({
    align: 'center',
    color: isInputValid ? { custom: globalColors.purple60 } : 'label',
    size: '17pt / 135%',
    weight: 'semibold',
  });

  const labelTertiary = useForegroundColor('labelTertiary');

  const shouldWarn = type === 'watch' ? isImportable : isWatchable;

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
          <AccentColorProvider color={colors.alpha(globalColors.purple60, 1)}>
            <Box
              alignItems="center"
              as={ButtonPressAnimation}
              background="accent"
              borderRadius={99}
              height="36px"
              justifyContent="center"
              onPress={handlePressImportButton}
              width={{ custom: 88 }}
            >
              <Text align="center" color="label" size="15pt" weight="bold">
                {type === 'watch' ? '􀨭 Watch' : '􀂍 Import'}
              </Text>
            </Box>
          </AccentColorProvider>
        </Inset>
      </Box>
    </>
  );
};
