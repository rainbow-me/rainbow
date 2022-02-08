import React from 'react';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
import { Box, Text } from '@rainbow-me/design-system';
import Routes from '@rainbow-me/routes';

export const ENSConfirmRegisterSheetHeight = 600;

export default function ENSConfirmRegisterSheet() {
  const { navigate, goBack } = useNavigation();

  return (
    <SlackSheet
      additionalTopPadding
      contentHeight={ENSConfirmRegisterSheetHeight}
      height="100%"
      scrollEnabled={false}
    >
      <Box
        background="body"
        paddingVertical="30px"
        style={{ height: ENSConfirmRegisterSheetHeight }}
      >
        <Box alignItems="center" flexGrow={1} justifyContent="center">
          <Text>register confirmation placeholder</Text>
        </Box>
        <SheetActionButtonRow>
          <SheetActionButton
            label="Hold to Buy"
            onPress={() => {
              goBack();
              setTimeout(() => {
                navigate(Routes.PROFILE_SCREEN);
              }, 50);
            }}
            size="big"
            weight="heavy"
          />
        </SheetActionButtonRow>
      </Box>
    </SlackSheet>
  );
}
