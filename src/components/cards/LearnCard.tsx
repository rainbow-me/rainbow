import { Box, Column, Columns, Inline, Stack, Text } from '@/design-system';
import { useTheme } from '@/theme';
import React, { useCallback, useReducer } from 'react';
import { GenericCard } from './GenericCard';
import { LearnCardDetails, learnCards, learnCategoryColors } from './constants';
import { IconOrb } from './reusables/IconOrb';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { delay } from '@/helpers/utilities';
import lang from 'i18n-js';

export const LearnCardHeight = 184;

interface LearnCardProps {
  cardDetails: LearnCardDetails;
  type: 'square' | 'stretch';
}

export const LearnCard = ({ cardDetails, type }: LearnCardProps) => {
  const { navigate } = useNavigation();
  const { isDarkMode } = useTheme();
  const [index, incrementIndex] = useReducer(
    x => (x === learnCards.length - 1 ? 0 : x + 1),
    0
  );
  const themedLearnCategoryColors = learnCategoryColors(isDarkMode);
  const { category, title, emoji, url, description } =
    cardDetails ?? learnCards[index];
  const {
    gradient,
    shadowColor,
    orbColorLight,
    primaryTextColor,
    secondaryTextColor,
  } = themedLearnCategoryColors[category];

  const onPress = useCallback(() => {
    navigate(Routes.LEARN_WEB_VIEW_SCREEN, {
      title,
      category,
      url,
      cardType: type,
    });
    !cardDetails && delay(300).then(incrementIndex);
  }, [cardDetails, category, navigate, title, type, url]);

  return (
    <GenericCard
      type={type}
      gradient={gradient}
      onPress={onPress}
      color={shadowColor}
    >
      {type === 'square' ? (
        <Box height="full" justifyContent="space-between">
          <Inline alignHorizontal="justify">
            <Text
              size="13pt"
              weight="heavy"
              color={{ custom: primaryTextColor }}
            >
              {`􀫸 ${lang.t('cards.learn.learn')}`}
            </Text>
            <IconOrb color={orbColorLight} icon={emoji} />
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
            >
              {title}
            </Text>
          </Stack>
        </Box>
      ) : (
        <Stack space="36px">
          <Box height={{ custom: 65 }}>
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
                  >
                    {title}
                  </Text>
                </Stack>
              </Column>
              <Column width="content">
                <IconOrb color={orbColorLight} icon={emoji} />
              </Column>
            </Columns>
          </Box>
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
