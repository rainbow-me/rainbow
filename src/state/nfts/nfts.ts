import { createStoreActions, createVirtualStore } from '@storesjs/stores';
import { type Address } from 'viem';

import { useWalletsStore } from '@/state/wallets/walletsStore';

import { createNftsStore } from './createNftsStore';

export const useNftsStore = createVirtualStore(
  $ => createNftsStore($(useWalletsStore, state => state.accountAddress)),
  getStore => ({
    getState: (address?: Address | string) => {
      const store = getStore();
      return address && address !== useWalletsStore.getState().accountAddress ? createNftsStore(address).getState() : store.getState();
    },
  })
);

export const nftsStoreActions = createStoreActions(useNftsStore);
