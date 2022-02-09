import React from 'react';
import { SheetActionButton, SheetActionButtonRow } from '../components/sheet';
import TintButton from '../components/buttons/TintButton';
import { useNavigation } from '../navigation/Navigation';
import { Box, Heading, Stack, Text } from '@rainbow-me/design-system';
import Routes from '@rainbow-me/routes';
import { useTheme } from '@rainbow-me/context';

export default function ENSAssignRecordsSheet() {
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const handlePressContinue = useCallback(() => {
    navigate(Routes.ENS_CONFIRM_REGISTER_SHEET);
  }, [navigate]);

  const handlePressBack = useCallback(() => {
    navigate(Routes.ENS_SEARCH_SHEET);
  }, [navigate]);

  return (
    <>
      <Box background="body" flexGrow={1}>
        <Box background="accent" height={{ custom: 125 }}></Box>
        <Box flexGrow={1}>
          <Stack alignHorizontal="center" space="15px">
            <Heading size="26px" weight="heavy">
              placeholder.eth
            </Heading>
            <Text
              color={{ custom: 'rgba(152, 117, 215, 1)' }}
              size="16px"
              weight="heavy"
            >
              Create your profile
            </Text>
          </Stack>
        </Box>
        <SheetActionButtonRow>
          <TintButton onPress={handlePressBack} color="secondary60">
            􀆉 Back
          </TintButton>
          <SheetActionButton
            label="Review"
            onPress={handlePressContinue}
            size="big"
            weight="heavy"
          />
        </SheetActionButtonRow>
      </Box>
    </>
  );
}
