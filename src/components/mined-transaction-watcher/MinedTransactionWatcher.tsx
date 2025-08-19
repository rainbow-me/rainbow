import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useWatchMinedTransactions } from '@/hooks/useWatchMinedTransactions';
import { time } from '@/utils/time';
import { memo, useRef, useCallback, useEffect } from 'react';
import { useMinedTransactionsStore } from '@/state/minedTransactions/minedTransactions';

export const MinedTransactionWatcher = memo(function MinedTransactionWatcher() {
  const address = useAccountAddress();
  const { watchMinedTransactions } = useWatchMinedTransactions({ address });
  const isProcessingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const minedTransactions = useMinedTransactionsStore(state => state.minedTransactions[address] || []);

  const processTransactions = useCallback(async () => {
    if (isProcessingRef.current || minedTransactions.length === 0) return;

    isProcessingRef.current = true;
    try {
      await watchMinedTransactions(minedTransactions);
    } finally {
      // eslint-disable-next-line require-atomic-updates
      isProcessingRef.current = false;
    }
  }, [watchMinedTransactions, minedTransactions]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    if (minedTransactions.length > 0) {
      processTransactions();
      intervalRef.current = setInterval(processTransactions, time.seconds(1));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [minedTransactions.length, processTransactions]);

  return null;
});
