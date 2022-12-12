import React from 'react';
import { DoubleLineTransactionDetailsRow } from '@/screens/transaction-details/components/DoubleLineTransactionDetailsRow';
import { TransactionDetailsSymbol } from '@/screens/transaction-details/components/TransactionDetailsSymbol';
import { RainbowTransactionFee } from '@/entities/transactions/transaction';
import lang from 'i18n-js';

type Props = { fee?: RainbowTransactionFee };

export const TransactionDetailsValueAndFeeSection: React.FC<Props> = ({
  fee,
}) => {
  return (
    <>
      {fee && (
        <DoubleLineTransactionDetailsRow
          leftComponent={<TransactionDetailsSymbol icon="􀵟" withBackground />}
          title={lang.t('transaction_details.network_fee')}
          value={fee.value.display}
          secondaryValue={fee.native?.display ?? ''}
        />
      )}
    </>
  );
};
