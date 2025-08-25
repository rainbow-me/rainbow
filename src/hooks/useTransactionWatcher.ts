import { useRef, useCallback, useEffect } from 'react';
import { time } from '@/utils/time';

interface UseTransactionWatcherProps<T> {
  transactions: T[];
  watchFunction: (transactions: T[]) => Promise<void>;
  interval?: number;
}

export function useTransactionWatcher<T>({ transactions, watchFunction, interval = time.seconds(1) }: UseTransactionWatcherProps<T>) {
  const isProcessingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const processTransactions = useCallback(async () => {
    if (isProcessingRef.current || transactions.length === 0) return;

    isProcessingRef.current = true;
    try {
      await watchFunction(transactions);
    } finally {
      // eslint-disable-next-line require-atomic-updates
      isProcessingRef.current = false;
    }
  }, [watchFunction, transactions]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    if (transactions.length > 0) {
      processTransactions();
      intervalRef.current = setInterval(processTransactions, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [transactions.length, processTransactions, interval]);
}
