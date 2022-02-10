import { useRoute } from '@react-navigation/native';
import React from 'react';
import TintButton from '../components/buttons/TintButton';
import { SheetActionButton, SheetActionButtonRow } from '../components/sheet';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '../navigation/Navigation';
import {
  AccentColorProvider,
  Box,
  Cover,
  Heading,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { usePersistentDominantColorFromImage } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

export default function ENSAssignRecordsSheet() {
  const { params } = useRoute();
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const handlePressContinue = useCallback(() => {
    navigate(Routes.ENS_CONFIRM_REGISTER_SHEET);
  }, [navigate]);

  const handlePressBack = useCallback(() => {
    navigate(Routes.ENS_SEARCH_SHEET);
  }, [navigate]);

  const avatarColor =
    usePersistentDominantColorFromImage('TODO').result || colors.purple;

  const avatarRadius = 35;

  const formIsEmpty = true; // change this when ens records are merged in

  return (
    <AccentColorProvider color={avatarColor}>
      <Box background="body" flexGrow={1}>
        <Box flexGrow={1}>
          <Box
            background="accent"
            height={{ custom: 125 }}
            marginBottom={{ custom: 70 }}
          >
            <Cover alignHorizontal="center">
              <Box
                background="swap"
                borderRadius={avatarRadius}
                height={{ custom: avatarRadius * 2 }}
                top={{ custom: 105 }}
                width={{ custom: avatarRadius * 2 }}
              />
            </Cover>
          </Box>
          <Stack alignHorizontal="center" space="15px">
            <Heading size="26px" weight="heavy">
              {params ? params.name : ''}
            </Heading>
            <Text color="accent" size="16px" weight="heavy">
              Create your profile
            </Text>
          </Stack>
        </Box>
        <SheetActionButtonRow>
          <TintButton color="secondary60" onPress={handlePressBack}>
            􀆉 Back
          </TintButton>
          {formIsEmpty ? (
            <TintButton color="secondary60" onPress={handlePressContinue}>
              Skip
            </TintButton>
          ) : (
            <SheetActionButton
              color={avatarColor}
              label="Review"
              onPress={handlePressContinue}
              size="big"
              weight="heavy"
            />
          )}
        </SheetActionButtonRow>
      </Box>
    </AccentColorProvider>
  );
}
