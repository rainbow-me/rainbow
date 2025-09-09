import { useCallback, useEffect, useMemo, useRef } from 'react';
import { MinedTransaction, RainbowTransaction } from '@/entities';
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

  const watchFnRef = useRef(watchFunction);
  watchFnRef.current = watchFunction;

  const transactionsKey = useMemo(() => buildTransactionsKey(transactions), [transactions]);

  const runWatcher = useCallback(
    async (abortController: AbortController) => {
      if (abortController.signal.aborted) return;

      const currentTransactions = transactionsRef.current;
      if (currentTransactions.length) {
        try {
          await watchFnRef.current(currentTransactions, abortController);
        } catch (e) {
          if (!abortController.signal.aborted) logger.error(new RainbowError('[useTransactionWatcher]: Error watching transactions', e));
        }
      }

      if (!abortController.signal.aborted) {
        timeoutRef.current = setTimeout(() => runWatcher(abortController), interval);
      }
    },
    [interval]
  );

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    abortRef.current?.abort();

    if (!transactionsKey) return;

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
  }, [interval, runWatcher, transactionsKey]);
}

function buildTransactionsKey<T extends RainbowTransaction | MinedTransactionWithPolling>(transactions: T[]): string {
  let key = '';
  for (const transaction of transactions) {
    const tx: MinedTransaction | RainbowTransaction = 'transaction' in transaction ? transaction.transaction : transaction;
    key += `${tx.hash}:${tx.chainId}:${tx.nonce}:${tx.status}`;
  }
  return key;
}
