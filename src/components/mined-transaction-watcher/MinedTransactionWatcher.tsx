import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useWatchMinedTransactions } from '@/hooks/useWatchMinedTransactions';
import { useTransactionWatcher } from '@/hooks/useTransactionWatcher';
import { memo } from 'react';
import { useMinedTransactionsStore } from '@/state/minedTransactions/minedTransactions';

export const MinedTransactionWatcher = memo(function MinedTransactionWatcher() {
  const address = useAccountAddress();
  const { watchMinedTransactions } = useWatchMinedTransactions({ address });
  const minedTransactionsWithPolling = useMinedTransactionsStore(state => state.minedTransactions[address] || []);

  useTransactionWatcher({
    transactions: minedTransactionsWithPolling,
    watchFunction: watchMinedTransactions,
  });

  return null;
});
