import { createStoreActions, createVirtualStore, type SetStateArgs } from '@storesjs/stores';

import { useWalletsStore } from '@/state/wallets/walletsStore';

import { createNftsStore } from './createNftsStore';
import { type NftsQueryState, type NftsStoreType } from './types';

/** Follows the selected wallet; addressed access edits that account's own snapshot. */
export const useNftsStore = createVirtualStore(
  $ => {
    const store = createNftsStore($(useWalletsStore, s => s.accountAddress));
    void store.getState().fetchOpenCollections();
    return store;
  },
  getStore => ({
    getState: (address?: string) => getStoreForAddress(getStore, address).getState(),
    setState: (...args: SetStateArgs<NftsQueryState, [address?: string]>) => {
      const [update, replace, address] = args;
      const store = getStoreForAddress(getStore, address);
      return replace ? store.setState(update, replace) : store.setState(update);
    },
  })
);

export const nftsActions = createStoreActions(useNftsStore);

function getStoreForAddress(getStore: () => NftsStoreType, address?: string): NftsStoreType {
  const store = getStore();
  if (!address || store.getState().address === address) return store;
  return createNftsStore(address, false);
}
