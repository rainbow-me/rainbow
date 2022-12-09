import React from 'react';
import { SingleLineTransactionDetailsRow } from '@/screens/transaction-details/components/SingleLineTransactionDetailsRow';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import { shortenTxHashString } from '@/screens/transaction-details/helpers/shortenTxHashString';

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
          icon={'􀆃'}
          title={'Tx Hash'}
          value={formattedHash}
        />
      )}
    </>
  );
};
