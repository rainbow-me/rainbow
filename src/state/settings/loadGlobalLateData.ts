import { getWalletBalances, WALLET_BALANCES_FROM_STORAGE } from '@/handlers/localstorage/walletBalances';
import { queryClient } from '@/react-query';
import { contactsLoadState } from '@/redux/contacts';
import { imageMetadataCacheLoadState } from '@/redux/imageMetadata';
import { keyboardHeightsLoadState } from '@/redux/keyboardHeight';
import store from '@/redux/store';

/** Loads deferred application data once during startup. */
export async function loadGlobalLateData(): Promise<void> {
  await Promise.allSettled([
    queryClient.prefetchQuery([WALLET_BALANCES_FROM_STORAGE], getWalletBalances),
    store.dispatch(contactsLoadState()),
    store.dispatch(imageMetadataCacheLoadState()),
    store.dispatch(keyboardHeightsLoadState()),
  ]);
}
