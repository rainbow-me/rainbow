import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getWalletBalances,
  WALLET_BALANCES_FROM_STORAGE,
} from '@/handlers/localstorage/walletBalances';
import { queryClient } from '@/react-query';
import { nonceManagerLoadState } from '@/redux/nonceManager';
import { AppState } from '@/redux/store';
import { promiseUtils } from '@/utils';
import logger from '@/utils/logger';
import { imageMetadataCacheLoadState } from '@/redux/imageMetadata';
import { keyboardHeightsLoadState } from '@/redux/keyboardHeight';
import { transactionSignaturesLoadState } from '@/redux/transactionSignatures';
import { contactsLoadState } from '@/redux/contacts';
import { uniswapLoadState } from '@/redux/uniswap';
import { userListsLoadState } from '@/redux/userLists';

const loadWalletBalanceNamesToCache = () =>
  queryClient.prefetchQuery([WALLET_BALANCES_FROM_STORAGE], getWalletBalances);

export default function useLoadGlobalLateData() {
  const dispatch = useDispatch();

  const walletReady = useSelector(
    ({ appState: { walletReady } }: AppState) => walletReady
  );

  const loadGlobalLateData = useCallback(async () => {
    if (!walletReady) {
      return false;
    }
    logger.sentry('Load wallet global late data');
    const promises = [];

    // wallet nonces
    const p1 = dispatch(nonceManagerLoadState());

    // mainnet eth balances for all wallets
    const p2 = loadWalletBalanceNamesToCache();

    // user lists
    const p3 = dispatch(userListsLoadState());

    // favorites
    const p4 = dispatch(uniswapLoadState());

    // contacts
    const p5 = dispatch(contactsLoadState());

    // image metadata
    const p6 = dispatch(imageMetadataCacheLoadState());

    // keyboard heights
    const p7 = dispatch(keyboardHeightsLoadState());

    // tx method names
    const p8 = dispatch(transactionSignaturesLoadState());

    promises.push(p1, p2, p3, p4, p5, p6, p7, p8);

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '(Promise<void> | ((dispatch: Dis... Remove this comment to see the full error message
    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch, walletReady]);

  return loadGlobalLateData;
}
