import { memo } from 'react';
import { useTransactionWatcher } from '@/hooks/useTransactionWatcher';
import { useWatchMinedTransactions } from '@/hooks/useWatchMinedTransactions';
import { MinedTransactionWithPolling, useMinedTransactionsStore } from '@/state/minedTransactions/minedTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';

const EMPTY_MINED_TRANSACTIONS: MinedTransactionWithPolling[] = [];

export const MinedTransactionWatcher = memo(function MinedTransactionWatcher() {
  const address = useAccountAddress();
  const minedTransactionsWithPolling = useMinedTransactionsStore(state => state.minedTransactions[address] || EMPTY_MINED_TRANSACTIONS);

  useTransactionWatcher({
    transactions: minedTransactionsWithPolling,
    watchFunction: useWatchMinedTransactions({ address }),
  });

  return null;
});
