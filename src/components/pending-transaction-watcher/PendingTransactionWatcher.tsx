import { memo } from 'react';

import { type PendingTransaction } from '@/entities/transactions';
import { useTransactionWatcher } from '@/hooks/useTransactionWatcher';
import { useWatchPendingTransactions } from '@/hooks/useWatchPendingTxs';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { shallowEqual } from '@/worklets/comparisons';

const EMPTY_PENDING_TRANSACTIONS: PendingTransaction[] = [];

export const PendingTransactionWatcher = memo(function PendingTransactionWatcher() {
  const address = useAccountAddress();
  const transactions = usePendingTransactionsStore(state => state.getPendingTransactions(address), shallowEqual);

  useTransactionWatcher({
    transactions,
    watchFunction: useWatchPendingTransactions({ address }),
  });

  return null;
});
