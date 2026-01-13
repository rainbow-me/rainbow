import React from 'react';
import { Box } from '@/design-system/components/Box/Box';
import { Stack } from '@/design-system/components/Stack/Stack';
import { Text } from '@/design-system/components/Text/Text';

type Props = {
  title: string;
  emoji: string;
  text: string;
};

export const RewardsProgramStatus: React.FC<Props> = ({ emoji, text, title }) => {
  return (
    <Box style={{ display: 'flex' }} width="full" height="full" justifyContent="center" alignItems="center">
      <Stack space="24px" alignHorizontal="center">
        <Text size="44pt" color="label" weight="heavy" containsEmoji>
          {emoji}
        </Text>
        <Text size="22pt" color="label" weight="heavy">
          {title}
        </Text>
        <Text size="15pt" color="label" align="center">
          {text}
        </Text>
      </Stack>
    </Box>
  );
};
