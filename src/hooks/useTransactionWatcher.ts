import { useCallback, useEffect, useRef } from 'react';
import { RainbowTransaction } from '@/entities';
import { RainbowError, logger } from '@/logger';
import { MinedTransactionWithPolling } from '@/state/minedTransactions/minedTransactions';
import { time } from '@/utils/time';

interface UseTransactionWatcherProps<T extends RainbowTransaction | MinedTransactionWithPolling> {
  interval?: number;
  transactions: T[];
  watchFunction: (transactions: T[], abortController: AbortController) => Promise<void>;
}

export function useTransactionWatcher<T extends RainbowTransaction | MinedTransactionWithPolling>({
  interval = time.seconds(1),
  transactions,
  watchFunction,
}: UseTransactionWatcherProps<T>) {
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transactionsRef = useRef<T[]>(transactions);

  transactionsRef.current = transactions;

  const runWatcher = useCallback(
    async (abortController: AbortController) => {
      if (abortController.signal.aborted) return;

      const currentTransactions = transactionsRef.current;
      if (currentTransactions.length) {
        try {
          await watchFunction(currentTransactions, abortController);
        } catch (e) {
          if (!abortController.signal.aborted) logger.error(new RainbowError('[useTransactionWatcher]: Error watching transactions', e));
        }
      }

      if (!abortController.signal.aborted) {
        timeoutRef.current = setTimeout(() => runWatcher(abortController), interval);
      }
    },
    [interval, watchFunction]
  );

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    abortRef.current?.abort();

    if (!transactions.length) return;

    const controller = new AbortController();
    abortRef.current = controller;

    runWatcher(controller);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      controller.abort();
      abortRef.current = null;
    };
  }, [interval, runWatcher, transactions]);
}
