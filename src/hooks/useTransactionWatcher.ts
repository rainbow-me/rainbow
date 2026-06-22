import { useCallback } from 'react';

import { time } from '@/framework/core/utils/time';
import { useWatcher } from '@/framework/ui/hooks/useWatcher';

interface UseTransactionWatcherProps<T> {
  interval?: number;
  transactions: T[];
  watchFunction: (transactions: T[], abortController: AbortController) => Promise<void>;
}

/**
 * Watches a set of transactions: polls `watchFunction` with the latest `transactions` while there
 * are any, stopping when the set empties. A thin wrapper over `useWatcher`.
 */
export function useTransactionWatcher<T>({ interval = time.seconds(1), transactions, watchFunction }: UseTransactionWatcherProps<T>) {
  useWatcher({
    enabled: transactions.length > 0,
    interval,
    watchFunction: useCallback(
      (abortController: AbortController) => watchFunction(transactions, abortController),
      [watchFunction, transactions]
    ),
  });
}
