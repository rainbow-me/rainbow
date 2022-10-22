import {
  AccentColorProvider,
  Box,
  Column,
  Columns,
  DebugLayout,
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
import IconOrb from './IconOrb';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useDimensions } from '@/hooks';

interface LearnCardProps {
  cardDetails: LearnCardDetails;
  type: 'square' | 'stretch';
}

const LearnCard = ({ cardDetails, type }: LearnCardProps) => {
  const { category, title, emoji, url, description } = cardDetails;
  const { gradient, shadowColor, accentColor } = learnCategoryColors[category];
  const { navigate } = useNavigation();
  const { width } = useDimensions();

  return (
    <GenericCard
      type={type}
      gradient={gradient}
      onPress={() =>
        navigate(Routes.WEB_VIEW_SCREEN_NAVIGATOR, {
          params: { title, url },
          screen: Routes.WEB_VIEW_SCREEN,
        })
      }
      shadowColor={shadowColor}
    >
      <AccentColorProvider color={accentColor}>
        {type === 'square' ? (
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
                <Text
                  containsEmoji
                  size="17pt"
                  weight="bold"
                  align="center"
                  color="label"
                >
                  {emoji}
                </Text>
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
        ) : (
          <Stack space="36px">
            <Columns space="20px">
              <Column>
                <Stack space="12px">
                  <Text size="13pt" weight="bold" color="accent">
                    {category}
                  </Text>
                  <Text size="22pt" weight="heavy" color="labelWhite">
                    {title}
                  </Text>
                </Stack>
              </Column>
              <Column width="content">
                <IconOrb color={accentColor}>
                  <Text
                    containsEmoji
                    size="17pt"
                    weight="bold"
                    align="center"
                    color="label"
                  >
                    {emoji}
                  </Text>
                </IconOrb>
              </Column>
            </Columns>
            <Text
              color="labelWhite"
              size="13pt"
              weight="semibold"
              numberOfLines={3}
            >
              {description}
            </Text>
          </Stack>
        )}
      </AccentColorProvider>
    </GenericCard>
  );
};

export default LearnCard;
