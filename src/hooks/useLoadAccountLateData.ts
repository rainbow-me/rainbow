import { useCallback } from 'react';
import { promiseUtils } from '../utils';
import { prefetchAccountENSDomains } from './useAccountENSDomains';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';
import logger from '@/utils/logger';
import { ensRegistrationsLoadState } from '@/redux/ensRegistration';
import { useDispatch } from 'react-redux';
import { showcaseTokensUpdateStateFromWeb } from '@/redux/showcaseTokens';
import { hiddenTokensUpdateStateFromWeb } from '@/redux/hiddenTokens';

export default function useLoadAccountLateData() {
  const { accountAddress } = useAccountSettings();
  const { isReadOnlyWallet } = useWallets();
  const dispatch = useDispatch();

  const loadAccountLateData = useCallback(async () => {
    logger.sentry('Load wallet account late data');

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
