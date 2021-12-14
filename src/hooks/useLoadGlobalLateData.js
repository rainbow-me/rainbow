import { useCallback } from 'react';
import { queryCache } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import {
  getWalletBalances,
  WALLET_BALANCES_FROM_STORAGE,
} from '@rainbow-me/handlers/localstorage/walletBalances';
import { contactsLoadState } from '@rainbow-me/redux/contacts';
import { nonceManagerLoadState } from '@rainbow-me/redux/nonceManager';
import { promiseUtils } from '@rainbow-me/utils';
import logger from 'logger';

const loadWalletBalanceNamesToCache = () =>
  queryCache.prefetchQuery(WALLET_BALANCES_FROM_STORAGE, getWalletBalances);

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
    const p1 = dispatch(contactsLoadState());
    const p2 = loadWalletBalanceNamesToCache();
    const p3 = dispatch(nonceManagerLoadState());
    promises.push(p1, p2, p3);

    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch, walletReady]);

  return loadGlobalData;
}
