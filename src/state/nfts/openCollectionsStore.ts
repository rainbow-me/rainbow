import { createStoreActions, createVirtualStore } from '@storesjs/stores';
import { type Address } from 'viem';

import { useWalletsStore } from '@/state/wallets/walletsStore';

import { createOpenCollectionsStore } from './createOpenCollectionsStore';

export const useOpenCollectionsStore = createVirtualStore(
  $ => createOpenCollectionsStore($(useWalletsStore, state => state.accountAddress)),
  getStore => ({
    getState: (address?: Address | string) => {
      const store = getStore();
      return address && address !== useWalletsStore.getState().accountAddress
        ? createOpenCollectionsStore(address).getState()
        : store.getState();
    },
  })
);

export const openCollectionsActions = createStoreActions(useOpenCollectionsStore);

export type OpenCollectionsStore = typeof useOpenCollectionsStore;
