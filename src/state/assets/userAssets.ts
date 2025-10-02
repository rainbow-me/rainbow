import { Address } from 'viem';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { EqualityFn, Selector } from '../internal/types';
import { createStoreFactoryUtils } from '../internal/utils/factoryUtils';
import { createUserAssetsStore } from './createUserAssetsStore';
import { UserAssetsStateToPersist } from './persistence';
import { startPositionsAssetsSync } from './positionsSync';
import { QueryEnabledUserAssetsState, UserAssetsRouter, UserAssetsStoreType } from './types';

const useCachedUserAssetsStore = createDerivedStore(
  $ => {
    const address = $(useWalletsStore).accountAddress;
    return createUserAssetsStore(address);
  },
  { equalityFn: areStoresEqualWithRebind, fastMode: true }
);

const { persist, portableSubscribe, rebindSubscriptions } = createStoreFactoryUtils<UserAssetsStoreType, UserAssetsStateToPersist>(
  useCachedUserAssetsStore.getState
);

function areStoresEqualWithRebind(previousStore: UserAssetsStoreType, store: UserAssetsStoreType): boolean {
  const areStoresEqual = Object.is(previousStore, store);
  if (!areStoresEqual) rebindSubscriptions(previousStore, store);
  return areStoresEqual;
}

function useUserAssetsStoreInternal(): QueryEnabledUserAssetsState;
function useUserAssetsStoreInternal<T>(selector: Selector<QueryEnabledUserAssetsState, T>, equalityFn?: EqualityFn<T>): T;
function useUserAssetsStoreInternal<T>(
  selector?: Selector<QueryEnabledUserAssetsState, T>,
  equalityFn?: EqualityFn<T>
): QueryEnabledUserAssetsState | T {
  const store = useCachedUserAssetsStore();
  return selector ? store(selector, equalityFn) : store();
}

export const useUserAssetsStore: UserAssetsRouter = Object.assign(useUserAssetsStoreInternal, {
  destroy: () => useCachedUserAssetsStore.destroy(),
  getInitialState: () => useCachedUserAssetsStore.getState().getInitialState(),
  getState: (address?: Address | string) =>
    address ? createUserAssetsStore(address).getState() : useCachedUserAssetsStore.getState().getState(),
  persist,
  setState: (...args: Parameters<UserAssetsRouter['setState']>) => {
    const [partial, replace, address] = args;
    return address
      ? createUserAssetsStore(address).setState(partial, replace)
      : useCachedUserAssetsStore.getState().setState(partial, replace);
  },
  subscribe: portableSubscribe,
});

startPositionsAssetsSync();

// TODO: Remove this and consolidate into useUserAssetsStore
export const userAssetsStore = useUserAssetsStore;
