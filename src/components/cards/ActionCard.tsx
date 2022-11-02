import { Box, Stack, Text } from '@/design-system';
import React from 'react';
import { GenericCard } from './GenericCard';
import { CardColorway } from './utils/types';
import { IconOrb } from './reusables/IconOrb';

interface ActionCardProps {
  colorway: CardColorway;
  sfSymbolIcon: string;
  onPress: () => void;
  title: string;
}

export const ActionCard = ({
  colorway,
  sfSymbolIcon,
  onPress,
  title,
}: ActionCardProps) => {
  const { gradient, shadowColor, orbColorDark, primaryTextColor } = colorway;
  return (
    <GenericCard
      type="square"
      gradient={gradient}
      onPress={onPress}
      color={shadowColor}
    >
      <Box height="full" justifyContent="space-between" alignItems="flex-start">
        <IconOrb
          color={orbColorDark}
          icon={sfSymbolIcon}
          shadowColor="shadow"
        />
        <Stack space="10px">
          <Text color={{ custom: primaryTextColor }} size="20pt" weight="heavy">
            {title}
          </Text>
        </Stack>
      </Box>
    </GenericCard>
  );
};
