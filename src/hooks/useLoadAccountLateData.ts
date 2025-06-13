import { logger } from '@/logger';
import { ensRegistrationsLoadState } from '@/redux/ensRegistration';
import { hiddenTokensUpdateStateFromWeb } from '@/redux/hiddenTokens';
import { showcaseTokensUpdateStateFromWeb } from '@/redux/showcaseTokens';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
<<<<<<< HEAD
import { useAccountAddress, getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
=======
import { useAccountAddress, useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
>>>>>>> origin/develop
import { promiseUtils } from '../utils';
import { prefetchAccountENSDomains } from './useAccountENSDomains';

export default function useLoadAccountLateData() {
  const accountAddress = useAccountAddress();
<<<<<<< HEAD
=======
  const isReadOnlyWallet = useIsReadOnlyWallet();
>>>>>>> origin/develop
  const dispatch = useDispatch();

  const loadAccountLateData = useCallback(async () => {
    logger.debug('[useLoadAccountLateData]: Load wallet account late data');

    const promises = [];

    // showcase & hidden tokens from firebase
    const p1 = dispatch(showcaseTokensUpdateStateFromWeb());
    const p2 = dispatch(hiddenTokensUpdateStateFromWeb());

    promises.push(p1, p2);

    if (!getIsReadOnlyWallet()) {
      // ENS registration info
      const p3 = dispatch(ensRegistrationsLoadState());
      const p4 = prefetchAccountENSDomains({ accountAddress });

      promises.push(p3, p4);
    }

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '((dispatch: ThunkDispatch<{ read... Remove this comment to see the full error message
    return promiseUtils.PromiseAllWithFails(promises);
  }, [accountAddress, dispatch]);

  return loadAccountLateData;
}
