import { useCallback, useRef } from 'react';

import { time } from '@/framework/core/utils/time';
import { useWatcher } from '@/framework/ui/hooks/useWatcher';

interface UseTransactionWatcherProps<T> {
  interval?: number;
  transactions: T[];
  watchFunction: (transactions: T[], abortController: AbortController) => Promise<void>;
}

/**
 * Polls while `transactions` is nonempty.
 *
 * Each run receives the latest transaction array without restarting
 * the polling schedule when that array changes.
 */
export function useTransactionWatcher<T>({ interval = time.seconds(1), transactions, watchFunction }: UseTransactionWatcherProps<T>) {
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;

  useWatcher({
    enabled: transactions.length > 0,
    interval,
    watchFunction: useCallback(
      (abortController: AbortController) => watchFunction(transactionsRef.current, abortController),
      [watchFunction]
    ),
  });
}
