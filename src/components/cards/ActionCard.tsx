import { Box, Stack, Text } from '@/design-system';
import React from 'react';
import { GenericCard } from './GenericCard';
import { CardColor } from './utils/types';
import { IconOrb } from './reusables/IconOrb';
import { getCardColorways } from './utils/constants';
import { useTheme } from '@/theme';

interface ActionCardProps {
  colorway: CardColor;
  sfSymbolIcon: string;
  onPress: () => void;
  title: string;
}

export const ActionCard = ({ colorway, sfSymbolIcon, onPress, title }: ActionCardProps) => {
  const { isDarkMode } = useTheme();
  const cardColorways = getCardColorways(isDarkMode);
  const { gradient, shadowColor, orbColorDark, primaryTextColor } = cardColorways[colorway];

  return (
    <GenericCard
      type="square"
      gradient={{
        colors: gradient,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
      }}
      onPress={onPress}
      color={shadowColor}
    >
      <Box height="full" justifyContent="space-between" alignItems="flex-start">
        <IconOrb color={orbColorDark} icon={sfSymbolIcon} shadowColor="accent" />
        <Stack space="10px">
          <Text color={{ custom: primaryTextColor }} size="20pt" weight="heavy">
            {title}
          </Text>
        </Stack>
      </Box>
    </GenericCard>
  );
};
