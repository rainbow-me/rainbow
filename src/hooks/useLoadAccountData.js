import { useCallback } from 'react';
import { queryCache } from 'react-query';
import { useDispatch } from 'react-redux';
import {
  getTopMovers,
  TOP_MOVERS_FROM_STORAGE,
} from '../handlers/localstorage/topMovers';
import networkTypes from '../helpers/networkTypes';
import { addCashLoadState } from '../redux/addCash';
import { contactsLoadState } from '../redux/contacts';
import { dataLoadState } from '../redux/data';
import { coinListLoadState } from '../redux/editOptions';
import { openStateSettingsLoadState } from '../redux/openStateSettings';
import { requestsLoadState } from '../redux/requests';
import { savingsLoadState } from '../redux/savings';
import { settingsLoadState } from '../redux/settings';
import { showcaseTokensLoadState } from '../redux/showcaseTokens';
import { uniqueTokensLoadState } from '../redux/uniqueTokens';
import { uniswapLoadState } from '../redux/uniswap';
import { walletConnectLoadState } from '../redux/walletconnect';
import { logger, promiseUtils } from '../utils';

const loadTopMoversToCache = () =>
  queryCache.prefetchQuery(TOP_MOVERS_FROM_STORAGE, getTopMovers);

export default function useLoadAccountData() {
  const dispatch = useDispatch();

  const loadAccountData = useCallback(
    async network => {
      logger.sentry('Load wallet data');
      await dispatch(openStateSettingsLoadState());
      await dispatch(coinListLoadState());
      await dispatch(showcaseTokensLoadState());
      const promises = [];
      const p1 = dispatch(settingsLoadState());
      promises.push(p1);
      if (network === networkTypes.mainnet) {
        const p2 = dispatch(dataLoadState());
        const p3 = dispatch(savingsLoadState());
        const p4 = dispatch(uniqueTokensLoadState());
        const p5 = dispatch(walletConnectLoadState());
        const p6 = dispatch(requestsLoadState());
        promises.push(p2, p3, p4, p5, p6);
      }

      const p6 = dispatch(uniswapLoadState());
      const p7 = dispatch(contactsLoadState());
      const p8 = dispatch(addCashLoadState());
      promises.push(p6, p7, p8);

      const p9 = loadTopMoversToCache();
      promises.push(p9);

      return promiseUtils.PromiseAllWithFails(promises);
    },
    [dispatch]
  );

  return loadAccountData;
}
