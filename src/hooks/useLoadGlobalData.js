import { useCallback } from 'react';
import { queryCache } from 'react-query';
import { useDispatch } from 'react-redux';
import {
  getTopMovers,
  TOP_MOVERS_FROM_STORAGE,
} from '../handlers/localstorage/topMovers';
import {
  getWalletBalances,
  WALLET_BALANCES_FROM_STORAGE,
} from '../handlers/localstorage/walletBalances';
import { contactsLoadState } from '../redux/contacts';
import { settingsLoadState } from '../redux/settings';
import { promiseUtils } from '../utils';
import logger from 'logger';

const loadTopMoversToCache = () =>
  queryCache.prefetchQuery(TOP_MOVERS_FROM_STORAGE, getTopMovers);

const loadWalletBalanceNamesToCache = () =>
  queryCache.prefetchQuery(WALLET_BALANCES_FROM_STORAGE, getWalletBalances);

export default function useLoadGlobalData() {
  const dispatch = useDispatch();

  const loadGlobalData = useCallback(async () => {
    logger.sentry('Load wallet global data');
    const promises = [];
    const p1 = dispatch(settingsLoadState());
    const p2 = dispatch(contactsLoadState());
    const p3 = loadTopMoversToCache();
    const p4 = loadWalletBalanceNamesToCache();
    promises.push(p1, p2, p3, p4);

    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch]);

  return loadGlobalData;
}
