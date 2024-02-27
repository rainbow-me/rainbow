import { usePoll } from './usePoll';
import { useWatchPendingTransactions } from './useWatchPendingTxs';

const PENDING_TRANSACTION_POLLING_INTERVAL = 5000;

export function usePendingTransactionWatcher({ address }: { address: string }) {
  const { watchPendingTransactions } = useWatchPendingTransactions({ address });
  usePoll(watchPendingTransactions, PENDING_TRANSACTION_POLLING_INTERVAL);
}
