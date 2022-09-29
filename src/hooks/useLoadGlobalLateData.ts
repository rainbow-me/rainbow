import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getWalletBalances,
  WALLET_BALANCES_FROM_STORAGE,
} from '@/handlers/localstorage/walletBalances';
import { queryClient } from '@/react-query';
import { nonceManagerLoadState } from '@/redux/nonceManager';
import { AppState } from '@/redux/store';
import { promiseUtils } from '@/utils';
import logger from '@/utils/logger';
import sentry from '@/utils/sentry';
import { captureException } from '@sentry/react-native';

const loadWalletBalanceNamesToCache = () =>
  queryClient.prefetchQuery([WALLET_BALANCES_FROM_STORAGE], getWalletBalances);

export default function useLoadGlobalLateData() {
  const dispatch = useDispatch();

  const walletReady = useSelector(
    ({ appState: { walletReady } }: AppState) => walletReady
  );

  const loadGlobalData = useCallback(async () => {
    if (!walletReady) {
      return false;
    }
    logger.sentry('Load wallet global late data');
    const promises: any[] = [];
    const p1 = loadWalletBalanceNamesToCache();
    const p2 = dispatch(nonceManagerLoadState());
    promises.push(p1, p2);

    const a = () => {
      try {
        promiseUtils.PromiseAllWithFails(promises);
      } catch (e) {
        logger.error('ERROR on loadGlobalData', JSON.stringify(e));
        captureException('ERROR on loadGlobalData: ' + JSON.stringify(e));
      }
    };
    return a;
  }, [dispatch, walletReady]);

  return loadGlobalData;
}
