import * as React from 'react';
import { Box, Text } from '@/design-system';
import { RainbowTransaction } from '@/entities';

type Props = {
  transaction: RainbowTransaction;
};

export const TransactionDetailsContent: React.FC<Props> = ({ transaction }) => {
  return (
    <Box background="surfacePrimary" flexGrow={1} paddingHorizontal="20px">
      <Text color="label" size="11pt">
        {JSON.stringify(transaction, null, 2)}
      </Text>
    </Box>
  );
};
