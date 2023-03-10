import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import networkTypes from '../helpers/networkTypes';
import { addCashLoadState } from '../redux/addCash';
import { dataLoadState } from '../redux/data';
import { hiddenTokensLoadState } from '../redux/hiddenTokens';
import { requestsLoadState } from '../redux/requests';
import { showcaseTokensLoadState } from '../redux/showcaseTokens';
import { walletConnectLoadState } from '../redux/walletconnect';
import { promiseUtils } from '../utils';
import logger from '@/utils/logger';
import { useAccountSettings } from '.';
import { fetchLegacyNFTs } from '@/resources/nfts';

export default function useLoadAccountData() {
  const dispatch = useDispatch();
  const { accountAddress } = useAccountSettings();

  const loadAccountData = useCallback(
    async network => {
      logger.sentry('Load wallet account data');
      await dispatch(showcaseTokensLoadState());
      await dispatch(hiddenTokensLoadState());
      const promises = [];

      // tokens + nfts
      if (network === networkTypes.mainnet) {
        const p1 = dispatch(dataLoadState());
        const p2 = fetchLegacyNFTs(accountAddress);
        promises.push(p1, p2);
      }
      // WC requests + connections
      const p3 = dispatch(requestsLoadState());
      const p4 = dispatch(walletConnectLoadState());

      // add cash
      const p5 = dispatch(addCashLoadState());

      promises.push(p3, p4, p5);

      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '((dispatch: ThunkDispatch<{ read... Remove this comment to see the full error message
      return promiseUtils.PromiseAllWithFails(promises);
    },
    [dispatch]
  );

  return loadAccountData;
}
