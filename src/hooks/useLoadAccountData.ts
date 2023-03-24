import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import networkTypes from '../helpers/networkTypes';
import { dataLoadState } from '../redux/data';
import { hiddenTokensLoadState } from '../redux/hiddenTokens';
import { requestsLoadState } from '../redux/requests';
import { showcaseTokensLoadState } from '../redux/showcaseTokens';
import { uniqueTokensLoadState } from '../redux/uniqueTokens';
import { walletConnectLoadState } from '../redux/walletconnect';
import { promiseUtils } from '../utils';
import logger from '@/utils/logger';

export default function useLoadAccountData() {
  const dispatch = useDispatch();
  const loadAccountData = useCallback(
    async network => {
      logger.sentry('Load wallet account data');
      await dispatch(showcaseTokensLoadState());
      await dispatch(hiddenTokensLoadState());
      const promises = [];

      // tokens + nfts
      if (network === networkTypes.mainnet) {
        const p1 = dispatch(dataLoadState());
        const p2 = dispatch(uniqueTokensLoadState());
        promises.push(p1, p2);
      }
      // WC requests + connections
      const p3 = dispatch(requestsLoadState());
      const p4 = dispatch(walletConnectLoadState());

      promises.push(p3, p4);

      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '((dispatch: ThunkDispatch<{ read... Remove this comment to see the full error message
      return promiseUtils.PromiseAllWithFails(promises);
    },
    [dispatch]
  );

  return loadAccountData;
}
