import React from 'react';
import { Box, Stack } from '@/design-system';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import { DoubleLineTransactionDetailsRow } from '@/screens/transaction-details/components/DoubleLineTransactionDetailsRow';

type Props = { from?: string; to?: string };

export const TransactionDetailsFromToSection: React.FC<Props> = ({
  from,
  to,
}) => {
  if (from === undefined && to === undefined) {
    return null;
  }
  return (
    <Box paddingVertical="20px">
      <Stack space="20px">
        <DoubleLineTransactionDetailsRow
          leftComponent={null}
          title={'From'}
          value={'0x000'}
        />
        <DoubleLineTransactionDetailsRow
          leftComponent={null}
          title={'From'}
          value={'0x000'}
        />
      </Stack>
    </Box>
  );
};
