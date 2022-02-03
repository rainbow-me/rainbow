import React from 'react';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
import { Box, Text } from '@rainbow-me/design-system';
import Routes from '@rainbow-me/routes';

export const ENSConfirmCommitSheetHeight = 600;

export default function ENSConfirmCommitSheet() {
  const { goBack, navigate } = useNavigation();

  return (
    <SlackSheet
      additionalTopPadding
      contentHeight={ENSConfirmCommitSheetHeight}
      height="100%"
      scrollEnabled={false}
    >
      <Box
        background="body"
        paddingVertical="30px"
        style={{ height: ENSConfirmCommitSheetHeight }}
      >
        <Box alignItems="center" flexGrow={1} justifyContent="center">
          <Text>commit confirmation placeholder</Text>
        </Box>
        <SheetActionButtonRow>
          <SheetActionButton
            label="Hold to Confirm"
            onPress={() => {
              goBack();
              setTimeout(() => {
                navigate(Routes.ENS_COMMIT_INTERLUDE_SHEET);
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
