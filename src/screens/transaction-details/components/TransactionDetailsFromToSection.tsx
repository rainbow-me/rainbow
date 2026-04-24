import React from 'react';

import { Box } from '@/design-system';
import { type RainbowTransaction } from '@/entities/transactions';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';

import TransactionMasthead from './TransactionMasthead';

type Props = {
  transaction: RainbowTransaction;
  presentToast?: () => void;
};

export const TransactionDetailsFromToSection: React.FC<Props> = ({ transaction, presentToast }) => {
  return (
    <>
      <TransactionDetailsDivider />
      <Box paddingVertical="10px">
        <TransactionMasthead transaction={transaction} />
      </Box>
    </>
  );
};
