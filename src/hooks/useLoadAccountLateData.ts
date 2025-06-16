import { logger } from '@/logger';
import { ensRegistrationsLoadState } from '@/redux/ensRegistration';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAccountAddress, useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { promiseUtils } from '../utils';
import { prefetchAccountENSDomains } from './useAccountENSDomains';
import useMigrateShowcaseAndHidden from './useMigrateShowcaseAndHidden';

export default function useLoadAccountLateData() {
  const migrateShowcaseAndHidden = useMigrateShowcaseAndHidden();

  const accountAddress = useAccountAddress();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const dispatch = useDispatch();

  const loadAccountLateData = useCallback(async () => {
    logger.debug('[useLoadAccountLateData]: Load wallet account late data');

    const promises = [];

    if (!isReadOnlyWallet) {
      // ENS registration info
      const p1 = dispatch(ensRegistrationsLoadState());
      const p2 = prefetchAccountENSDomains({ accountAddress });

      promises.push(p1, p2);
    }

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '((dispatch: ThunkDispatch<{ read... Remove this comment to see the full error message
    await promiseUtils.PromiseAllWithFails(promises);

    await migrateShowcaseAndHidden();
  }, [accountAddress, dispatch, isReadOnlyWallet, migrateShowcaseAndHidden]);

  return loadAccountLateData;
}
