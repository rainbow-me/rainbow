import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { prefetchAccountENSDomains } from '@/features/ens/hooks/useAccountENSDomains';
import { ensRegistrationsLoadState } from '@/features/ens/redux/registration';
import { prefetchRnbwStakingPosition } from '@/features/rnbw-staking/utils/prefetchRnbwStakingPosition';
import { logger } from '@/logger';
import { getIsReadOnlyWallet, useAccountAddress } from '@/state/wallets/walletsStore';

export default function useLoadAccountLateData() {
  const accountAddress = useAccountAddress();
  const dispatch = useDispatch();

  const loadAccountLateData = useCallback(async () => {
    logger.debug('[useLoadAccountLateData]: Load wallet account late data');

    if (!getIsReadOnlyWallet()) {
      await Promise.allSettled([
        dispatch(ensRegistrationsLoadState()),
        prefetchAccountENSDomains({ accountAddress }),
        prefetchRnbwStakingPosition(),
      ]);
    }
  }, [accountAddress, dispatch]);

  return loadAccountLateData;
}
