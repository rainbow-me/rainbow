import { useCallback } from 'react';
import { queryCache } from 'react-query';
import { useDispatch } from 'react-redux';
import {
  getWalletBalances,
  WALLET_BALANCES_FROM_STORAGE,
} from '@rainbow-me/handlers/localstorage/walletBalances';
import { contactsLoadState } from '@rainbow-me/redux/contacts';
import { imageMetadataCacheLoadState } from '@rainbow-me/redux/imageMetadata';
import { keyboardHeightsLoadState } from '@rainbow-me/redux/keyboardHeight';
import { settingsLoadState } from '@rainbow-me/redux/settings';
import { topMoversLoadState } from '@rainbow-me/redux/topMovers';
import { transactionSignaturesLoadState } from '@rainbow-me/redux/transactionSignatures';
import { promiseUtils } from '@rainbow-me/utils';
import logger from 'logger';

const loadWalletBalanceNamesToCache = () =>
  queryCache.prefetchQuery(WALLET_BALANCES_FROM_STORAGE, getWalletBalances);

export default function useLoadGlobalData() {
  const dispatch = useDispatch();

  const loadGlobalData = useCallback(async () => {
    logger.sentry('Load wallet global data');
    const promises = [];
    const p1 = dispatch(settingsLoadState());
    const p2 = dispatch(contactsLoadState());
    const p3 = dispatch(topMoversLoadState());
    const p4 = loadWalletBalanceNamesToCache();
    const p5 = dispatch(imageMetadataCacheLoadState());
    const p6 = dispatch(keyboardHeightsLoadState());
    const p7 = dispatch(transactionSignaturesLoadState());

    promises.push(p1, p2, p3, p4, p5, p6, p7);

    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch]);

  return loadGlobalData;
}
