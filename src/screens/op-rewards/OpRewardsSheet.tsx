import React from 'react';
import { SlackSheet } from '@/components/sheet';
import { useDimensions } from '@/hooks';
import { Box, Text } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OpRewardsSheet: React.FC = () => {
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();

  return (
    // @ts-ignore
    <SlackSheet height="100%" contentHeight={height - top} scrollEnabled>
      <Box flexGrow={1}>
        <Text size="15pt" color="label">
          Temporary
        </Text>
      </Box>
    </SlackSheet>
  );
};
