import { useCallback } from 'react';
import { promiseUtils } from '../utils';
import { prefetchAccountENSDomains } from './useAccountENSDomains';
import useAccountSettings from './useAccountSettings';
import logger from 'logger';

export default function useLoadAccountLateData() {
  const { accountAddress } = useAccountSettings();

  const load = useCallback(async () => {
    logger.sentry('Load wallet account late data');
    return promiseUtils.PromiseAllWithFails([
      prefetchAccountENSDomains({ accountAddress }),
    ]);
  }, [accountAddress]);

  return load;
}
