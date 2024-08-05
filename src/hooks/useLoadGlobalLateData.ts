import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWalletBalances, WALLET_BALANCES_FROM_STORAGE } from '@/handlers/localstorage/walletBalances';
import { queryClient } from '@/react-query';
import { AppState } from '@/redux/store';
import { promiseUtils } from '@/utils';
import logger from '@/utils/logger';
import { imageMetadataCacheLoadState } from '@/redux/imageMetadata';
import { keyboardHeightsLoadState } from '@/redux/keyboardHeight';
import { transactionSignaturesLoadState } from '@/redux/transactionSignatures';
import { contactsLoadState } from '@/redux/contacts';
import { favoritesQueryKey, refreshFavorites } from '@/resources/favorites';

const loadWalletBalanceNamesToCache = () => queryClient.prefetchQuery([WALLET_BALANCES_FROM_STORAGE], getWalletBalances);

export default function useLoadGlobalLateData() {
  const dispatch = useDispatch();

  const walletReady = useSelector(({ appState: { walletReady } }: AppState) => walletReady);

  const loadGlobalLateData = useCallback(async () => {
    if (!walletReady) {
      return false;
    }
    logger.sentry('Load wallet global late data');
    const promises = [];

    // mainnet eth balances for all wallets
    const p2 = loadWalletBalanceNamesToCache();

    // favorites
    const p3 = queryClient.prefetchQuery({
      queryKey: favoritesQueryKey,
      queryFn: () => refreshFavorites(),
    });

    // contacts
    const p4 = dispatch(contactsLoadState());

    // image metadata
    const p5 = dispatch(imageMetadataCacheLoadState());

    // keyboard heights
    const p6 = dispatch(keyboardHeightsLoadState());

    // tx method names
    const p7 = dispatch(transactionSignaturesLoadState());

    promises.push(p2, p3, p4, p5, p6, p7);

    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '(Promise<void> | ((dispatch: Dis... Remove this comment to see the full error message
    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch, walletReady]);

  return loadGlobalLateData;
}
