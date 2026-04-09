import { memo } from 'react';

import { type RainbowTransaction } from '@/entities/transactions';
import { useTransactionWatcher } from '@/hooks/useTransactionWatcher';
import { useWatchPendingTransactions } from '@/hooks/useWatchPendingTxs';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';

const EMPTY_PENDING_TRANSACTIONS: RainbowTransaction[] = [];

export const PendingTransactionWatcher = memo(function PendingTransactionWatcher() {
  const address = useAccountAddress();
  const pendingTransactions = usePendingTransactionsStore(state => state.pendingTransactions[address] || EMPTY_PENDING_TRANSACTIONS);

  useTransactionWatcher({
    transactions: pendingTransactions,
    watchFunction: useWatchPendingTransactions({ address }),
  });

  return null;
});
