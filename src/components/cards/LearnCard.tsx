import {
  AccentColorProvider,
  Box,
  Inline,
  Inset,
  Stack,
  Text,
} from '@/design-system';
import { useTheme } from '@/theme';
import { Linking, Text as NativeText } from 'react-native';
import React from 'react';
import GenericCard from './GenericCard';
import { Emoji } from '../text';
import { ForegroundColor } from '@/design-system/color/palettes';
import { LearnCardDetails, learnCategoryColors } from './constants';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

interface LearnCardProps {
  cardDetails: LearnCardDetails;
}

const LearnCard = ({ cardDetails }: LearnCardProps) => {
  const { category, title, emoji, url, description } = cardDetails;
  const { gradient, primaryColor, secondaryColor } = learnCategoryColors[
    category
  ];
  const { navigate } = useNavigation();

  return (
    <GenericCard
      type="square"
      gradient={gradient}
      onPress={() =>
        navigate(Routes.WEB_VIEW_SCREEN_NAVIGATOR, {
          params: { title, url },
          screen: Routes.WEB_VIEW_SCREEN,
        })
      }
      shadowColor={primaryColor}
    >
      <AccentColorProvider color={secondaryColor}>
        <Box height="full" justifyContent="space-between">
          <Inline alignHorizontal="justify">
            <Text size="13pt" weight="heavy" color="labelWhite">
              􀫸 LEARN
            </Text>
            <Box
              width={{ custom: 36 }}
              height={{ custom: 36 }}
              borderRadius={18}
              background="accent"
              alignItems="center"
              justifyContent="center"
            >
              <NativeText style={{ fontSize: 14, paddingLeft: 1 }}>
                {emoji}
              </NativeText>
            </Box>
          </Inline>
          <Stack space="10px">
            <Text color="accent" size="13pt" weight="bold">
              {category}
            </Text>
            <Text color="labelWhite" size="17pt" weight="heavy">
              {title}
            </Text>
          </Stack>
        </Box>
      </AccentColorProvider>
    </GenericCard>
  );
};

export default LearnCard;
