import { createStoreActions, createVirtualStore, type SetStateArgs } from '@storesjs/stores';
import type { Address } from 'viem';

import { usePositionsStore } from '@/features/positions/stores/positionsStore';
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

function getStoreForAddress(getStore: () => ReturnType<typeof createUserAssetsStore>, address?: Address) {
  const store = getStore();
  if (!address || store.getState().address === address) return store;
  return createUserAssetsStore(address);
}
