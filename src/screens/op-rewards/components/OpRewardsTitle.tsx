import React from 'react';
import { Box, Text } from '@/design-system';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';

const PLACEHOLDER_HEIGHT = 30;
const PLACEHOLDER_WIDTH = 200;

type Props = { loading?: boolean; text: string };

export const OpRewardsTitle: React.FC<Props> = ({ loading, text }) => {
  if (loading) {
    return (
      <Box paddingBottom="24px">
        <Box
          width={{ custom: PLACEHOLDER_WIDTH }}
          height={{ custom: PLACEHOLDER_HEIGHT }}
        >
          <Skeleton>
            <FakeText height={PLACEHOLDER_HEIGHT} />
          </Skeleton>
        </Box>
      </Box>
    );
  } else {
    return (
      <Box paddingBottom="24px">
        <Text color="label" size="30pt" weight="heavy">
          {text}
        </Text>
      </Box>
    );
  }
};
