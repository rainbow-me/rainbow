import React from 'react';
import { Box } from '@/design-system';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import { RainbowTransaction } from '@/entities';
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
