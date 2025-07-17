import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useWatchPendingTransactions } from '@/hooks/useWatchPendingTxs';
import { usePoll } from '@/hooks/usePoll';
import { time } from '@/utils/time';
import { memo } from 'react';

export const PendingTransactionWatcher = memo(function PendingTransactionWatcher() {
  const address = useAccountAddress();
  const { watchPendingTransactions } = useWatchPendingTransactions({ address });
  usePoll(watchPendingTransactions, time.seconds(5));
  return null;
});
