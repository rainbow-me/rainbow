import React from 'react';
import { Box, Stack, Text } from '@/design-system';
import { useDimensions } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  emoji: string;
  text: string;
};

export const RewardsProgramStatus: React.FC<Props> = ({
  emoji,
  text,
  title,
}) => {
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();

  return (
    <Box
      width="full"
      height={{ custom: height - top }}
      justifyContent="center"
      alignItems="center"
    >
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
