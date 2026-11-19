import { createStoreActions, createVirtualStore, type SetStateArgs } from '@storesjs/stores';
import type { Address } from 'viem';

import { useWalletsStore } from '@/state/wallets/walletsStore';

import { createUserAssetsStore } from './createUserAssetsStore';
import type { QueryEnabledUserAssetsState } from './types';

export const useUserAssetsStore = createVirtualStore(
  $ => {
    const address = $(useWalletsStore, s => s.accountAddress);
    return createUserAssetsStore(address);
  },
  getStore => ({
    getState: (address?: Address) => getStoreForAddress(getStore, address).getState(),
    setState: (...args: SetStateArgs<QueryEnabledUserAssetsState, [address?: Address]>) => {
      const [update, replace, address] = args;
      const store = getStoreForAddress(getStore, address);
      return replace ? store.setState(update, replace) : store.setState(update);
    },
  })
);

export const userAssetsActions = createStoreActions(useUserAssetsStore);

function getStoreForAddress(getStore: () => ReturnType<typeof createUserAssetsStore>, address?: Address) {
  const store = getStore();
  if (!address || store.getState().address === address) return store;
  return createUserAssetsStore(address);
}
