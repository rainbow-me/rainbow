import { useRef, useCallback, useEffect } from 'react';
import { time } from '@/utils/time';

interface UseTransactionWatcherProps<T> {
  transactions: T[];
  watchFunction: (transactions: T[], signal: AbortSignal) => Promise<void>;
  interval?: number;
}

export function useTransactionWatcher<T>({ transactions, watchFunction, interval = time.seconds(1) }: UseTransactionWatcherProps<T>) {
  const isProcessingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const processTransactions = useCallback(async () => {
    if (isProcessingRef.current || transactions.length === 0) return;

    isProcessingRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    try {
      await watchFunction(transactions, abortControllerRef.current.signal);
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
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [transactions.length, processTransactions, interval]);
}
