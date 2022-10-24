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
import { Linking, Text as NativeText, View } from 'react-native';
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
  const { navigate } = useNavigation();
  const { width } = useDimensions();
  const { isDarkMode } = useTheme();
  const themedLearnCategoryColors = learnCategoryColors(isDarkMode);
  const {
    category,
    title,
    emoji,
    url,
    description,
    numberOfLines,
  } = cardDetails;
  const {
    gradient,
    shadowColor,
    orbColorLight,
    primaryTextColor,
    secondaryTextColor,
  } = themedLearnCategoryColors[category];

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
      {type === 'square' ? (
        <Box height="full" justifyContent="space-between">
          <Inline alignHorizontal="justify">
            <Text
              size="13pt"
              weight="heavy"
              color={{ custom: primaryTextColor }}
            >
              􀫸 LEARN
            </Text>
            <IconOrb color={orbColorLight} textIcon={emoji} />
          </Inline>
          <Stack space="10px">
            <Text
              color={{ custom: secondaryTextColor }}
              size="13pt"
              weight="bold"
            >
              {category}
            </Text>
            <Text
              color={{ custom: primaryTextColor }}
              size="17pt"
              weight="heavy"
              numberOfLines={numberOfLines}
            >
              {title}
            </Text>
          </Stack>
        </Box>
      ) : (
        <Stack space="36px">
          <Columns space="20px">
            <Column>
              <Stack space="12px">
                <Text
                  size="13pt"
                  weight="bold"
                  color={{ custom: secondaryTextColor }}
                >
                  {category}
                </Text>
                <Text
                  size="22pt"
                  weight="heavy"
                  color={{ custom: primaryTextColor }}
                  numberOfLines={numberOfLines}
                >
                  {title}
                </Text>
              </Stack>
            </Column>
            <Column width="content">
              <IconOrb color={orbColorLight} textIcon={emoji} />
            </Column>
          </Columns>
          <Text
            color={{ custom: primaryTextColor }}
            size="13pt"
            weight="semibold"
            numberOfLines={3}
          >
            {description}
          </Text>
        </Stack>
      )}
    </GenericCard>
  );
};

export default LearnCard;
