import { type Address } from 'viem';

import { getAccountAddress, useAccountAddress } from '@/state/wallets/walletsStore';

import { type EqualityFn, type Selector } from '../internal/types';
import { createStoreFactoryUtils } from '../internal/utils/factoryUtils';
import { createUserAssetsStore } from './createUserAssetsStore';
import { type UserAssetsStateToPersist } from './persistence';
import { setupPositionsAssetsSync } from './positionsSync';
import { type QueryEnabledUserAssetsState, type UserAssetsRouter, type UserAssetsStoreType } from './types';
import { userAssetsStoreManager } from './userAssetsStoreManager';

const { persist, portableSubscribe, rebindSubscriptions } = createStoreFactoryUtils<UserAssetsStoreType, UserAssetsStateToPersist>(
  getOrCreateStore
);

function getOrCreateStore(address?: Address | string): UserAssetsStoreType {
  const rawAddress = address?.length ? address : getAccountAddress();
  const { address: cachedAddress, cachedStore } = userAssetsStoreManager.getState();
  /**
   * This fallback can be removed once Redux is no longer the source of truth for the current
   * accountAddress. It's needed to ensure there's an address available immediately upon app
   * launch, which currently is not the case — the initial Redux address is an empty string.
   */
  const accountAddress = rawAddress?.length ? rawAddress : (cachedAddress ?? rawAddress);

  if (cachedStore && cachedAddress === accountAddress) return cachedStore;

  const newStore = createUserAssetsStore(accountAddress);

  if (cachedStore) rebindSubscriptions(cachedStore, newStore);

  userAssetsStoreManager.setState({ address: accountAddress, cachedStore: newStore });

  setupPositionsAssetsSync();

  return newStore;
}

function useUserAssetsStoreInternal(): QueryEnabledUserAssetsState;
function useUserAssetsStoreInternal<T>(selector: Selector<QueryEnabledUserAssetsState, T>, equalityFn?: EqualityFn<T>): T;
function useUserAssetsStoreInternal<T>(
  selector?: Selector<QueryEnabledUserAssetsState, T>,
  equalityFn?: EqualityFn<T>
): QueryEnabledUserAssetsState | T {
  const address = useAccountAddress();
  const store = getOrCreateStore(address);
  return selector ? store(selector, equalityFn) : store();
}

export const useUserAssetsStore: UserAssetsRouter = Object.assign(useUserAssetsStoreInternal, {
  getInitialState: () => getOrCreateStore().getInitialState(),
  getState: (address?: Address | string) => getOrCreateStore(address).getState(),
  persist,
  setState: (...args: Parameters<UserAssetsRouter['setState']>) => {
    const [partial, replace, address] = args;
    // Cast to satisfy zustand v5's narrowed setState overloads while preserving the router's boolean `replace`.
    return getOrCreateStore(address).setState(partial, replace as false);
  },
  subscribe: portableSubscribe,
});

// TODO: Remove this and consolidate into useUserAssetsStore
export const userAssetsStore = useUserAssetsStore;
