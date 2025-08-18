import { logger } from '@/logger';
import { ensRegistrationsLoadState } from '@/redux/ensRegistration';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAccountAddress, getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { prefetchAccountENSDomains } from './useAccountENSDomains';

export default function useLoadAccountLateData() {
  const accountAddress = useAccountAddress();
  const dispatch = useDispatch();

  const loadAccountLateData = useCallback(async () => {
    logger.debug('[useLoadAccountLateData]: Load wallet account late data');

    if (!getIsReadOnlyWallet()) {
      await Promise.allSettled([dispatch(ensRegistrationsLoadState()), prefetchAccountENSDomains({ accountAddress })]);
    }
  }, [accountAddress, dispatch]);

  return loadAccountLateData;
}
