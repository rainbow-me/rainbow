import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { ethereumUtils, isLowerCaseMatch } from '@/utils';
import { useCallback, useMemo } from 'react';

export default function usePendingTransactions() {
  const accountAddress = useAccountAddress();
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
