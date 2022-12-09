import React from 'react';
import { DoubleLineTransactionDetailsRow } from '@/screens/transaction-details/components/DoubleLineTransactionDetailsRow';
import { TransactionDetailsSymbol } from '@/screens/transaction-details/components/TransactionDetailsSymbol';
import { RainbowTransactionFee } from '@/entities/transactions/transaction';

type Props = { fee?: RainbowTransactionFee };

export const TransactionDetailsValueAndFeeSection: React.FC<Props> = ({
  fee,
}) => {
  return (
    <>
      {fee && (
        <DoubleLineTransactionDetailsRow
          leftComponent={<TransactionDetailsSymbol icon="􀵟" withBackground />}
          title={'Network Fee'}
          value={fee.value.display}
          secondaryValue={fee.native?.display ?? ''}
        />
      )}
    </>
  );
};
