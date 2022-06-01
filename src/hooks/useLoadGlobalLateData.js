import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { prefetchENSProfile } from './useENSProfile';
import { prefetchENSProfileImages } from './useENSProfileImages';
import { prefetchENSResolveName } from './useENSResolveName';
import {
  getWalletBalances,
  WALLET_BALANCES_FROM_STORAGE,
} from '@rainbow-me/handlers/localstorage/walletBalances';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { nonceManagerLoadState } from '@rainbow-me/redux/nonceManager';
import { ensIntroMarqueeNames } from '@rainbow-me/references';
import { promiseUtils } from '@rainbow-me/utils';
import logger from 'logger';

const loadWalletBalanceNamesToCache = () =>
  queryClient.prefetchQuery(WALLET_BALANCES_FROM_STORAGE, getWalletBalances);

export default function useLoadGlobalLateData() {
  const dispatch = useDispatch();

  const walletReady = useSelector(
    ({ appState: { walletReady } }) => walletReady
  );

  const loadGlobalData = useCallback(async () => {
    if (!walletReady) {
      return false;
    }
    logger.sentry('Load wallet global late data');
    const promises = [];
    const p1 = loadWalletBalanceNamesToCache();
    const p2 = dispatch(nonceManagerLoadState());
    const p3 = ensIntroMarqueeNames.map(async name => {
      prefetchENSResolveName(name);
      prefetchENSProfileImages({ name });
      prefetchENSProfile({ name });
    });
    promises.push(p1, p2, ...p3);

    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch, walletReady]);

  return loadGlobalData;
}
