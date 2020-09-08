import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import networkTypes from '../helpers/networkTypes';
import { addCashLoadState } from '../redux/addCash';
import { dataLoadState } from '../redux/data';
import { coinListLoadState } from '../redux/editOptions';
import { openStateSettingsLoadState } from '../redux/openStateSettings';
import { requestsLoadState } from '../redux/requests';
import { showcaseTokensLoadState } from '../redux/showcaseTokens';
import { uniqueTokensLoadState } from '../redux/uniqueTokens';
import { uniswapLoadState } from '../redux/uniswap';
import { uniswapLiquidityLoadState } from '../redux/uniswapLiquidity';
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
        const p2 = dispatch(uniqueTokensLoadState());
        promises.push(p1, p2);
      }
      const p3 = dispatch(requestsLoadState());
      const p4 = dispatch(walletConnectLoadState());
      const p5 = dispatch(uniswapLoadState());
      const p6 = dispatch(addCashLoadState());
      const p7 = dispatch(uniswapLiquidityLoadState());
      promises.push(p3, p4, p5, p6, p7);

      return promiseUtils.PromiseAllWithFails(promises);
    },
    [dispatch]
  );

  return loadAccountData;
}
