import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useWatchPendingTransactions } from '@/hooks/useWatchPendingTxs';
import { usePoll } from '@/hooks/usePoll';
import { time } from '@/utils/time';
import { memo, useRef, useCallback } from 'react';

export const PendingTransactionWatcher = memo(function PendingTransactionWatcher() {
  const address = useAccountAddress();
  const { watchPendingTransactions } = useWatchPendingTransactions({ address });
  const isProcessingRef = useRef(false);

  const safeWatchPendingTransactions = useCallback(async () => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    try {
      await watchPendingTransactions();
    } finally {
      // This is to satisify the linter
      if (isProcessingRef.current === true) {
        isProcessingRef.current = false;
      }
    }
  }, [watchPendingTransactions]);

  usePoll(safeWatchPendingTransactions, time.seconds(1));
  return null;
});
