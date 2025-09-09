import { useCallback } from 'react';
import { ethereumUtils, isLowerCaseMatch } from '@/utils';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { RainbowTransaction } from '@/entities';
import { shallowEqual } from '@/worklets/comparisons';

const EMPTY_PENDING_TRANSACTIONS: RainbowTransaction[] = [];

export default function usePendingTransactions() {
  const accountAddress = useAccountAddress();
  const pendingTransactions = usePendingTransactionsStore(
    state => state.pendingTransactions[accountAddress] || EMPTY_PENDING_TRANSACTIONS,
    shallowEqual
  );

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
