import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useWatchPendingTransactions } from '@/hooks/useWatchPendingTxs';
import { useTransactionWatcher } from '@/hooks/useTransactionWatcher';
import { memo } from 'react';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';

export const PendingTransactionWatcher = memo(function PendingTransactionWatcher() {
  const address = useAccountAddress();
  const { watchPendingTransactions } = useWatchPendingTransactions({ address });
  const pendingTransactions = usePendingTransactionsStore(state => state.pendingTransactions[address] || []);

  useTransactionWatcher({
    transactions: pendingTransactions,
    watchFunction: watchPendingTransactions,
  });

  return null;
});
