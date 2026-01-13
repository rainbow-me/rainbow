import React from 'react';
import { Box } from '@/design-system/components/Box/Box';
import { Text } from '@/design-system/components/Text/Text';

type Props = { text: string };

export const RewardsTitle: React.FC<Props> = ({ text }) => {
  return (
    <Box paddingBottom="24px">
      <Text color="label" size="30pt" weight="heavy">
        {text}
      </Text>
    </Box>
  );
};
