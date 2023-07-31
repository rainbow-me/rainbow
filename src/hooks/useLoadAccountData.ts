import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import networkTypes, { Network } from '../helpers/networkTypes';
import { dataLoadState } from '../redux/data';
import { hiddenTokensLoadState } from '../redux/hiddenTokens';
import { requestsLoadState } from '../redux/requests';
import { showcaseTokensLoadState } from '../redux/showcaseTokens';
import { walletConnectLoadState } from '../redux/walletconnect';
import { promiseUtils } from '../utils';
import logger from '@/utils/logger';
import { getNetworkObj } from '@/networks';

export default function useLoadAccountData() {
  const dispatch = useDispatch();
  const loadAccountData = useCallback(
    async (network: Network) => {
      logger.sentry('Load wallet account data');
      await dispatch(showcaseTokensLoadState());
      await dispatch(hiddenTokensLoadState());
      const promises = [];

      // tokens + nfts
      if (getNetworkObj(network).networkType !== 'testnet') {
        const p1 = dispatch(dataLoadState());
        promises.push(p1);
      }
      // WC requests + connections
      const p2 = dispatch(requestsLoadState());
      const p3 = dispatch(walletConnectLoadState());

      promises.push(p2, p3);

      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '((dispatch: ThunkDispatch<{ read... Remove this comment to see the full error message
      return promiseUtils.PromiseAllWithFails(promises);
    },
    [dispatch]
  );

  return loadAccountData;
}
