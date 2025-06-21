import { logger } from '@/logger';
import { ensRegistrationsLoadState } from '@/redux/ensRegistration';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAccountAddress, getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { prefetchAccountENSDomains } from './useAccountENSDomains';
import useMigrateShowcaseAndHidden from './useMigrateShowcaseAndHidden';

export default function useLoadAccountLateData() {
  const migrateShowcaseAndHidden = useMigrateShowcaseAndHidden();

  const accountAddress = useAccountAddress();
  const dispatch = useDispatch();

  const loadAccountLateData = useCallback(async () => {
    logger.debug('[useLoadAccountLateData]: Load wallet account late data');

    if (!getIsReadOnlyWallet()) {
      await Promise.allSettled([dispatch(ensRegistrationsLoadState()), prefetchAccountENSDomains({ accountAddress })]);
      await migrateShowcaseAndHidden();
    }
  }, [accountAddress, dispatch, migrateShowcaseAndHidden]);

  return loadAccountLateData;
}
