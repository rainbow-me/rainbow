import React from 'react';
import { SingleLineTransactionDetailsRow } from '@/screens/transaction-details/components/SingleLineTransactionDetailsRow';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import { shortenTxHashString } from '@/screens/transaction-details/helpers/shortenTxHashString';
import lang from 'i18n-js';

type Props = { hash?: string };

export const TransactionDetailsHashAndActionsSection: React.FC<Props> = ({
  hash,
}) => {
  const formattedHash = shortenTxHashString(hash);
  return (
    <>
      <TransactionDetailsDivider />
      {formattedHash && (
        <SingleLineTransactionDetailsRow
          icon="􀆃"
          title={lang.t('transaction_details.hash')}
          value={formattedHash}
        />
      )}
    </>
  );
};
