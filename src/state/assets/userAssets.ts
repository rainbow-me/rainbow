import { createDerivedStore, createStoreActions, createVirtualStore, type SetStateArgs } from '@storesjs/stores';
import type { Address } from 'viem';

import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { createUserAssetsStore } from './createUserAssetsStore';
import type { QueryEnabledUserAssetsState } from './types';
import { userAssetsStoreManager } from './userAssetsStoreManager';
import { createUserAssetSearch } from './utils';

export const useUserAssetsStore = createVirtualStore(
  $ => {
    const address = $(useWalletsStore, s => s.accountAddress);
    return createUserAssetsStore(address);
  },
  getStore => ({
    getState: (address?: Address | string) => getStoreForAddress(getStore, address).getState(),
    setState: (...args: SetStateArgs<QueryEnabledUserAssetsState, [address?: Address | string]>) => {
      const [update, replace, address] = args;
      const store = getStoreForAddress(getStore, address);
      return replace ? store.setState(update, replace) : store.setState(update);
    },
  })
);

export const userAssetsActions = createStoreActions(useUserAssetsStore);
export const userAssetsStore = useUserAssetsStore;

usePositionsStore.subscribe(
  state => {
    const address = useUserAssetsStore.getState().address;
    return { address, tokens: state.getTokenAddresses(address) };
  },
  ({ tokens }) => userAssetsActions.reprocessAssetsData(tokens),
  {
    equalityFn: (current, previous) => {
      if (current.address !== previous.address || current.tokens.size !== previous.tokens.size) return false;
      for (const address of current.tokens) {
        if (!previous.tokens.has(address)) return false;
      }
      return true;
    },
  }
);

const useUserAssetSearch = createDerivedStore($ =>
  createUserAssetSearch({
    listAssets: $(useUserAssetsStore, state => state.listAssets),
    hiddenAssets: $(useUserAssetsStore, state => state.hiddenAssets),
    currency: $(userAssetsStoreManager, state => state.currency),
  })
);

/** The active account's cached search result for its current query and chain filter. */
export const useUserAssetSearchResults = createDerivedStore($ => {
  const search = $(useUserAssetSearch);
  const filter = $(useUserAssetsStore, state => state.filter);
  const query = $(useUserAssetsStore, state => state.inputSearchQuery);
  return search(filter, query);
});

function getStoreForAddress(getStore: () => ReturnType<typeof createUserAssetsStore>, address?: Address | string) {
  const store = getStore();
  if (!address || store.getState().address === address) return store;
  return createUserAssetsStore(address);
}
