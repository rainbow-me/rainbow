import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useWatchMinedTransactions } from '@/hooks/useWatchMinedTransactions';
import { usePoll } from '@/hooks/usePoll';
import { time } from '@/utils/time';
import { memo, useRef, useCallback } from 'react';
import { useMinedTransactionsStore } from '@/state/minedTransactions/minedTransactions';

export const MinedTransactionWatcher = memo(function MinedTransactionWatcher() {
  const address = useAccountAddress();
  const { watchMinedTransactions } = useWatchMinedTransactions({ address });
  const isProcessingRef = useRef(false);
  const minedTransactions = useMinedTransactionsStore(state => state.minedTransactions[address] || []);

  const safeWatchMinedTransactions = useCallback(async () => {
    if (isProcessingRef.current || minedTransactions.length === 0) return;

    isProcessingRef.current = true;
    try {
      await watchMinedTransactions(minedTransactions);
    } finally {
      // This is to satisfy the linter
      if (isProcessingRef.current === true) {
        isProcessingRef.current = false;
      }
    }
  }, [watchMinedTransactions, minedTransactions]);

  usePoll(safeWatchMinedTransactions, time.seconds(1));
  return null;
});
