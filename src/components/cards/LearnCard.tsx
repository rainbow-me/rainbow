import { Box, Column, Columns, Inline, Stack, Text } from '@/design-system';
import React from 'react';
import { CardType, GenericCard } from './GenericCard';
import { getLearnCardColorway } from './utils/constants';
import { LearnCardDetails } from './utils/types';
import { IconOrb } from './reusables/IconOrb';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import * as i18n from '@/languages';
import { useTheme } from '@/theme';
import { useRoute } from '@react-navigation/native';
import { analyticsV2 } from '@/analytics';

type LearnCardProps = {
  cardDetails: LearnCardDetails;
  rotate?: () => void;
  type: CardType;
};

export const LearnCard = ({ cardDetails, rotate, type }: LearnCardProps) => {
  const { navigate } = useNavigation();
  const { isDarkMode } = useTheme();
  const { category, emoji, url, key } = cardDetails;
  const { name: routeName } = useRoute();
  const { gradient, shadowColor, orbColorLight, primaryTextColor, secondaryTextColor } = getLearnCardColorway(category, isDarkMode);

  const onPress = () => {
    analyticsV2.track(analyticsV2.event.cardPressed, {
      cardName: 'LearnCard',
      routeName,
      cardType: type,
    });
    navigate(Routes.LEARN_WEB_VIEW_SCREEN, {
      category,
      url,
      displayType: type,
      routeName,
      key,
    });
    rotate?.();
  };

  const translations = i18n.l.cards.learn;

  return (
    <GenericCard
      type={type}
      gradient={{
        colors: gradient,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
      }}
      onPress={onPress}
      color={shadowColor}
    >
      {type === 'square' ? (
        <Box height="full" justifyContent="space-between">
          <Inline alignHorizontal="justify">
            <Box style={{ maxWidth: 80 }}>
              <Text size="13pt" weight="heavy" color={{ custom: primaryTextColor }} numberOfLines={1}>
                {`􀫸 ${i18n.t(translations.learn).toUpperCase()}`}
              </Text>
            </Box>
            <IconOrb color={orbColorLight} icon={emoji} />
          </Inline>
          <Stack space="10px">
            <Text color={{ custom: secondaryTextColor }} size="13pt" weight="bold">
              {i18n.t(translations.categories[category])}
            </Text>
            <Text color={{ custom: primaryTextColor }} size="17pt" weight="heavy" numberOfLines={2}>
              {i18n.t(translations.cards[key].title)}
            </Text>
          </Stack>
        </Box>
      ) : (
        <Stack space="36px">
          <Box height={{ custom: 65 }}>
            <Columns space="20px">
              <Column>
                <Stack space="12px">
                  <Text size="13pt" weight="bold" color={{ custom: secondaryTextColor }}>
                    {i18n.t(translations.categories[category])}
                  </Text>
                  <Text size="22pt" weight="heavy" color={{ custom: primaryTextColor }}>
                    {i18n.t(translations.cards[key].title)}
                  </Text>
                </Stack>
              </Column>
              <Column width="content">
                <IconOrb color={orbColorLight} icon={emoji} />
              </Column>
            </Columns>
          </Box>
          <Text color={{ custom: primaryTextColor }} size="13pt" weight="semibold" numberOfLines={3}>
            {i18n.t(translations.cards[key].description)}
          </Text>
        </Stack>
      )}
    </GenericCard>
  );
};
