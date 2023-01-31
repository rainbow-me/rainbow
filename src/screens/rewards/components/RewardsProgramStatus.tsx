import React from 'react';
import { Box, Stack, Text } from '@/design-system';
import { useDimensions } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  status: 'error' | 'finished';
};

export const RewardsProgramStatus: React.FC<Props> = ({ status }) => {
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();

  const emoji = status === 'error' ? '😵' : '💸';
  const title = status === 'error' ? 'Something went wrong' : 'Program ended';
  const text =
    status === 'error'
      ? 'Please check your internet connection and check back later.'
      : 'Stay tuned for what we have in store for you next!';

  return (
    <Box
      width="full"
      height={{ custom: height - top - 40 }}
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
