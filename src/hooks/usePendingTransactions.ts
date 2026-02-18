import { useCallback } from 'react';
import ethereumUtils from '@/utils/ethereumUtils';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { RainbowTransaction } from '@/entities/transactions';

const EMPTY_PENDING_TRANSACTIONS: RainbowTransaction[] = [];

export default function usePendingTransactions() {
  const accountAddress = useAccountAddress();
  const pendingTransactions = usePendingTransactionsStore(state => state.pendingTransactions[accountAddress] || EMPTY_PENDING_TRANSACTIONS);

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
