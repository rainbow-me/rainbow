import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';
import { ethereumUtils, isLowerCaseMatch } from '@rainbow-me/utils';

export default function usePendingTransactions() {
  const pendingTransactions = useSelector(
    ({ data }: AppState) => data.pendingTransactions
  );

  const getPendingTransactionByHash = useCallback(
    (transactionHash: string) =>
      pendingTransactions.find(pendingTransaction =>
        isLowerCaseMatch(
          ethereumUtils.getHash(pendingTransaction) || '',
          transactionHash
        )
      ),
    [pendingTransactions]
  );

  return {
    getPendingTransactionByHash,
  };
}
