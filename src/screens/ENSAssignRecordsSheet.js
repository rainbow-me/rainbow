import React from 'react';
import {
  textRecordsFields,
  TextRecordsForm,
} from '../components/ens-registration';
import { SheetActionButton, SheetActionButtonRow } from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
import { Box, Heading, Inset, Stack, Text } from '@rainbow-me/design-system';
import Routes from '@rainbow-me/routes';

export default function ENSAssignRecordsSheet() {
  const { navigate } = useNavigation();

  const handlePressContinue = useCallback(() => {
    navigate(Routes.ENS_CONFIRM_REGISTER_SHEET);
  }, [navigate]);

  return (
    <Box background="body" flexGrow={1} paddingVertical="30px">
      <Box flexGrow={1}>
        <Inset horizontal="19px">
          <Stack space="30px">
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
            <TextRecordsForm
              defaultFields={[
                textRecordsFields.name,
                textRecordsFields.bio,
                textRecordsFields.website,
                textRecordsFields.twitter,
              ]}
            />
          </Stack>
        </Inset>
      </Box>
      <SheetActionButtonRow>
        <SheetActionButton
          label="Review"
          onPress={handlePressContinue}
          size="big"
          weight="heavy"
        />
      </SheetActionButtonRow>
    </Box>
  );
}
