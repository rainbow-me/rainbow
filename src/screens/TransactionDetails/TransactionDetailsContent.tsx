import * as React from 'react';
import { Box, DebugLayout, Text } from '@/design-system';
import { RainbowTransaction } from '@/entities';

type Props = {
  transaction: RainbowTransaction;
};

export const TransactionDetailsContent: React.FC<Props> = ({ transaction }) => {
  return (
    <DebugLayout>
      <Box background="surfacePrimary" flexGrow={1}>
        <Text color="label" size="11pt">
          {JSON.stringify(transaction, null, 2)}
        </Text>
      </Box>
    </DebugLayout>
  );
};
