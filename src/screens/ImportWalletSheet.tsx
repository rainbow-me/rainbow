import { Input } from '@/components/inputs';
import { SlackSheet } from '@/components/sheet';
import { Box, globalColors, Text, useTextStyle } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { colors } from '@/styles';
import React, { useMemo } from 'react';

export const ImportWalletSheet = () => {
  const headingStyle = useTextStyle({
    color: 'label',
    size: '17pt',
    weight: 'semibold',
  });

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
        <Text color="label" size="26pt" weight="bold">
          Watch an address
        </Text>
        <Input
          autoCorrect={false}
          keyboardType={android ? 'visible-password' : 'default'}
          // onChangeText={onChangeText}
          // onFocus={handleFocus}
          // ref={inputRef}
          selectionColor={colors.alpha(globalColors.purple60, 10)}
          spellCheck={false}
          style={useMemo(
            () => ({
              ...headingStyle,
              // height,
              // top: ios ? 1.5 : 8,
            }),
            [headingStyle]
          )}
          // testID={testID}
          // value={value}
        />
      </Box>
    </SlackSheet>
  );
};
