import { useCallback, useMemo } from 'react';
import { ethereumUtils, isLowerCaseMatch } from '@/utils';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';

import useAccountSettings from './useAccountSettings';

export default function usePendingTransactions() {
  const { accountAddress } = useAccountSettings();
  const storePendingTransactions = usePendingTransactionsStore(state => state.pendingTransactions);

  const pendingTransactions = useMemo(() => storePendingTransactions[accountAddress] || [], [accountAddress, storePendingTransactions]);
  const getPendingTransactionByHash = useCallback(
    (transactionHash: string) =>
      pendingTransactions.find(pendingTransaction => isLowerCaseMatch(ethereumUtils.getHash(pendingTransaction) || '', transactionHash)),
    [pendingTransactions]
  );

  return {
    getPendingTransactionByHash,
    pendingTransactions,
  };
}
