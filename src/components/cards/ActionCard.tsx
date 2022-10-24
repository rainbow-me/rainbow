import { Box, Stack, Text } from '@/design-system';
import React from 'react';
import GenericCard from './GenericCard';
import { CardColorway } from './constants';
import IconOrb from './IconOrb';

interface ActionCardProps {
  colorway: CardColorway;
  sfSymbolIcon: string;
  onPress: () => void;
  title: string;
}

const ActionCard = ({
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
      shadowColor={shadowColor}
    >
      <Box height="full" justifyContent="space-between" alignItems="flex-start">
        <IconOrb
          color={orbColorDark}
          textIcon={sfSymbolIcon}
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

export default ActionCard;
