import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import networkTypes from '../helpers/networkTypes';
import { addCashLoadState } from '../redux/addCash';
import { dataLoadState } from '../redux/data';
import { coinListLoadState } from '../redux/editOptions';
import { openStateSettingsLoadState } from '../redux/openStateSettings';
import { requestsLoadState } from '../redux/requests';
import { savingsLoadState } from '../redux/savings';
import { showcaseTokensLoadState } from '../redux/showcaseTokens';
import { uniqueTokensLoadState } from '../redux/uniqueTokens';
import { uniswapLoadState } from '../redux/uniswap';
import { walletConnectLoadState } from '../redux/walletconnect';
import { promiseUtils } from '../utils';
import logger from 'logger';

export default function useLoadAccountData() {
  const dispatch = useDispatch();

  const loadAccountData = useCallback(
    async network => {
      logger.sentry('Load wallet account data');
      await dispatch(openStateSettingsLoadState());
      await dispatch(coinListLoadState());
      await dispatch(showcaseTokensLoadState());
      const promises = [];
      if (network === networkTypes.mainnet) {
        const p1 = dispatch(dataLoadState());
        const p2 = dispatch(savingsLoadState());
        const p3 = dispatch(uniqueTokensLoadState());
        promises.push(p1, p2, p3);
      }
      const p4 = dispatch(requestsLoadState());
      const p5 = dispatch(walletConnectLoadState());
      const p6 = dispatch(uniswapLoadState());
      const p7 = dispatch(addCashLoadState());
      promises.push(p4, p5, p6, p7);

      return promiseUtils.PromiseAllWithFails(promises);
    },
    [dispatch]
  );

  return loadAccountData;
}
