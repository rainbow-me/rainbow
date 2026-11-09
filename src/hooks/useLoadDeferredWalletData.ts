import { useEffect } from 'react';

import { prefetchRnbwStakingPosition } from '@/features/rnbw-staking/utils/prefetchRnbwStakingPosition';
import { useWalletsStore } from '@/state/wallets/walletsStore';

/** Warms account data for the mounted wallet, cancelling work that has not started when selection changes. */
export function useLoadDeferredWalletData(): void {
  const accountAddress = useWalletsStore(state => state.accountAddress);
  const isReadOnly = useWalletsStore(state => state.getIsReadOnlyWallet());

  useEffect(() => {
    if (!accountAddress || isReadOnly) return;
    const callback = requestIdleCallback(() => {
      void prefetchRnbwStakingPosition();
    });
    return () => cancelIdleCallback(callback);
  }, [accountAddress, isReadOnly]);
}
