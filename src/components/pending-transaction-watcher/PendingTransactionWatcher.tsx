import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useWatchPendingTransactions } from '@/hooks/useWatchPendingTxs';
import { useTransactionWatcher } from '@/hooks/useTransactionWatcher';
import { memo } from 'react';
import { RainbowTransaction } from '@/entities';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';

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
