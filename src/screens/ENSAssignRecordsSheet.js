import React from 'react';
import { SheetActionButton, SheetActionButtonRow } from '../components/sheet';
import TintButton from '../components/buttons/TintButton';
import { useNavigation } from '../navigation/Navigation';
import { useTheme } from '../context/ThemeContext';
import { usePersistentDominantColorFromImage } from '@rainbow-me/hooks';
import {
  AccentColorProvider,
  Box,
  Cover,
  Heading,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import Routes from '@rainbow-me/routes';
import { useRoute } from '@react-navigation/native';

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
    usePersistentDominantColorFromImage('tbd').result || colors.purple;

  const avatarRadius = 35;

  return (
    <AccentColorProvider color={avatarColor}>
      <Box background={'body'} flexGrow={1}>
        <Box flexGrow={1}>
          <Box
            background="accent"
            height={{ custom: 125 }}
            marginBottom={{ custom: 70 }}
          >
            <Cover alignHorizontal="center">
              <Box
                background="swap"
                top={{ custom: 105 }}
                height={{ custom: avatarRadius * 2 }}
                width={{ custom: avatarRadius * 2 }}
                borderRadius={avatarRadius}
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
          <TintButton onPress={handlePressBack} color="secondary60">
            􀆉 Back
          </TintButton>
          <SheetActionButton
            color={avatarColor}
            label="Review"
            onPress={handlePressContinue}
            size="big"
            weight="heavy"
          />
        </SheetActionButtonRow>
      </Box>
    </AccentColorProvider>
  );
}
