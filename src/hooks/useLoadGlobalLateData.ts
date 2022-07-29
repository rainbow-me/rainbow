import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getWalletBalances,
  WALLET_BALANCES_FROM_STORAGE,
} from '@rainbow-me/handlers/localstorage/walletBalances';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { nonceManagerLoadState } from '@rainbow-me/redux/nonceManager';
import { promiseUtils } from '@rainbow-me/utils';
import logger from 'logger';

const loadWalletBalanceNamesToCache = () =>
  queryClient.prefetchQuery(WALLET_BALANCES_FROM_STORAGE, getWalletBalances);

export default function useLoadGlobalLateData() {
  const dispatch = useDispatch();

  const walletReady = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'appState' does not exist on type 'Defaul... Remove this comment to see the full error message
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
    promises.push(p1, p2);

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '(Promise<void> | ((dispatch: Dis... Remove this comment to see the full error message
    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch, walletReady]);

  return loadGlobalData;
}
