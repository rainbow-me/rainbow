import { useCallback } from 'react';
import { queryCache } from 'react-query';
import { useDispatch } from 'react-redux';
import {
  getWalletBalances,
  WALLET_BALANCES_FROM_STORAGE,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/localstor... Remove this comment to see the full error message
} from '@rainbow-me/handlers/localstorage/walletBalances';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/contacts' or... Remove this comment to see the full error message
import { contactsLoadState } from '@rainbow-me/redux/contacts';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/imageMetadat... Remove this comment to see the full error message
import { imageMetadataCacheLoadState } from '@rainbow-me/redux/imageMetadata';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/keyboardHeig... Remove this comment to see the full error message
import { keyboardHeightsLoadState } from '@rainbow-me/redux/keyboardHeight';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/nonceManager... Remove this comment to see the full error message
import { nonceManagerLoadState } from '@rainbow-me/redux/nonceManager';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/settings' or... Remove this comment to see the full error message
import { settingsLoadState } from '@rainbow-me/redux/settings';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/topMovers' o... Remove this comment to see the full error message
import { topMoversLoadState } from '@rainbow-me/redux/topMovers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/transactionS... Remove this comment to see the full error message
import { transactionSignaturesLoadState } from '@rainbow-me/redux/transactionSignatures';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { promiseUtils } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
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
    const p8 = dispatch(nonceManagerLoadState());

    promises.push(p1, p2, p3, p4, p5, p6, p7, p8);

    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch]);

  return loadGlobalData;
}
