import { useCallback } from 'react';
import { queryCache } from 'react-query';
import { useDispatch } from 'react-redux';
import {
  getTopMovers,
  TOP_MOVERS_FROM_STORAGE,
} from '../handlers/localstorage/topMovers';
import {
  getWalletBalanceNames,
  WALLET_BALANCE_NAMES_FROM_STORAGE,
} from '../handlers/localstorage/walletBalanceNames';
import { contactsLoadState } from '../redux/contacts';
import { logger, promiseUtils } from '../utils';

const loadTopMoversToCache = () =>
  queryCache.prefetchQuery(TOP_MOVERS_FROM_STORAGE, getTopMovers);

const loadWalletBalanceNamesToCache = () =>
  queryCache.prefetchQuery(
    WALLET_BALANCE_NAMES_FROM_STORAGE,
    getWalletBalanceNames
  );

export default function useLoadGlobalData() {
  const dispatch = useDispatch();

  const loadGlobalData = useCallback(async () => {
    logger.sentry('Load wallet global data');
    const promises = [];
    const p1 = dispatch(contactsLoadState());
    const p2 = loadTopMoversToCache();
    const p3 = loadWalletBalanceNamesToCache();
    promises.push(p1, p2, p3);

    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch]);

  return loadGlobalData;
}
