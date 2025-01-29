import React from 'react';
import { Box } from '@/design-system';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { TOKEN_PREVIEW_BAR_HEIGHT } from './TokenPreviewBar';
import { safeAreaInsetValues } from '@/utils';
import { TOKEN_LAUNCHER_HEADER_HEIGHT } from './TokenLauncherHeader';
import { SingleFieldInput } from './SingleFieldInput';

export function InfoInputStep() {
  return (
    <KeyboardAwareScrollView
      contentOffset={{ x: 0, y: -TOKEN_LAUNCHER_HEADER_HEIGHT }}
      contentInset={{ top: TOKEN_LAUNCHER_HEADER_HEIGHT }}
      contentContainerStyle={{
        alignItems: 'center',
        alignSelf: 'stretch',
        flexGrow: 1,
        justifyContent: 'center',
      }}
      keyboardDismissMode="interactive"
      bottomOffset={TOKEN_PREVIEW_BAR_HEIGHT + 12}
      // disableScrollOnKeyboardHide={true}
      // extraKeyboardSpace={-(TOKEN_PREVIEW_BAR_HEIGHT + safeAreaInsetValues.bottom)}
    >
      <Box width="full" gap={8} alignItems="center" paddingHorizontal="20px">
        <SingleFieldInput title="Ticker" placeholder="$NAME" />
        <SingleFieldInput title="Name" placeholder="Enter coin name" />
        <SingleFieldInput title="Total Supply" placeholder="0" />
        <Box borderRadius={16} backgroundColor="red" width="full" height={100} />
        <Box borderRadius={16} backgroundColor="blue" width="full" height={100} />
        <Box borderRadius={16} backgroundColor="green" width="full" height={250} />
        <SingleFieldInput title="Test" placeholder="Testing" />
      </Box>
    </KeyboardAwareScrollView>
  );
}
