import { logger } from '@/logger';
import { ensRegistrationsLoadState } from '@/redux/ensRegistration';
import { hiddenTokensUpdateStateFromWeb } from '@/redux/hiddenTokens';
import { showcaseTokensUpdateStateFromWeb } from '@/redux/showcaseTokens';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useWalletsStore, useAccountAddress } from '@/state/wallets/walletsStore';
import { promiseUtils } from '../utils';
import { prefetchAccountENSDomains } from './useAccountENSDomains';
import useAccountSettings from './useAccountSettings';

export default function useLoadAccountLateData() {
  const accountAddress = useAccountAddress();
  const isReadOnlyWallet = useWalletsStore(state => state.getIsReadOnlyWallet());
  const dispatch = useDispatch();

  const loadAccountLateData = useCallback(async () => {
    logger.debug('[useLoadAccountLateData]: Load wallet account late data');

    const promises = [];

    // showcase & hidden tokens from firebase
    const p1 = dispatch(showcaseTokensUpdateStateFromWeb());
    const p2 = dispatch(hiddenTokensUpdateStateFromWeb());

    promises.push(p1, p2);

    if (!isReadOnlyWallet) {
      // ENS registration info
      const p3 = dispatch(ensRegistrationsLoadState());
      const p4 = prefetchAccountENSDomains({ accountAddress });

      promises.push(p3, p4);
    }

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '((dispatch: ThunkDispatch<{ read... Remove this comment to see the full error message
    return promiseUtils.PromiseAllWithFails(promises);
  }, [accountAddress, dispatch, isReadOnlyWallet]);

  return loadAccountLateData;
}
