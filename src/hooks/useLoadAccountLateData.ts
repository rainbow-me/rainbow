import { useCallback } from 'react';

import { prefetchAccountENSDomains } from '@/features/ens/hooks/useAccountENSDomains';
import { prefetchRnbwStakingPosition } from '@/features/rnbw-staking/utils/prefetchRnbwStakingPosition';
import { logger } from '@/logger';
import { getIsReadOnlyWallet, useAccountAddress } from '@/state/wallets/walletsStore';

export function useLoadAccountLateData() {
  const accountAddress = useAccountAddress();

  const loadAccountLateData = useCallback(async () => {
    logger.debug('[useLoadAccountLateData]: Load wallet account late data');

    if (!getIsReadOnlyWallet()) {
      await Promise.allSettled([prefetchAccountENSDomains({ accountAddress }), prefetchRnbwStakingPosition()]);
    }
  }, [accountAddress]);

  return loadAccountLateData;
}
