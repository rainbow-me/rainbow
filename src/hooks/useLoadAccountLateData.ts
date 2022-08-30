import { useCallback } from 'react';
import { promiseUtils } from '../utils';
import { prefetchAccountENSDomains } from './useAccountENSDomains';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';
import logger from '@/utils/logger';

export default function useLoadAccountLateData() {
  const { accountAddress } = useAccountSettings();
  const { isReadOnlyWallet } = useWallets();

  const load = useCallback(async () => {
    logger.sentry('Load wallet account late data');
    return promiseUtils.PromiseAllWithFails([
      ...(!isReadOnlyWallet
        ? [prefetchAccountENSDomains({ accountAddress })]
        : []),
    ]);
  }, [accountAddress, isReadOnlyWallet]);

  return load;
}
