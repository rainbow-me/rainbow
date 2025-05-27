import { useSelector } from 'react-redux';
import { Address } from 'viem';
import reduxStore, { AppState } from '@/redux/store';
import { EqualityFn, Selector } from '../internal/types';
import { createStoreFactoryUtils } from '../internal/utils/factoryUtils';
import { createUserAssetsStore } from './createUserAssetsStore';
import { UserAssetsStateToPersist } from './persistence';
import { QueryEnabledUserAssetsState, UserAssetsRouter, UserAssetsStoreType } from './types';
import { userAssetsStoreManager } from './userAssetsStoreManager';

const { persist, portableSubscribe, rebindSubscriptions } = createStoreFactoryUtils<UserAssetsStoreType, UserAssetsStateToPersist>(
  getOrCreateStore
);

function getOrCreateStore(address?: Address | string): UserAssetsStoreType {
  const rawAddress = address?.length ? address : reduxStore.getState().settings.accountAddress;
  const { address: cachedAddress, cachedStore } = userAssetsStoreManager.getState();
  /**
   * This fallback can be removed once Redux is no longer the source of truth for the current
   * accountAddress. It's needed to ensure there's an address available immediately upon app
   * launch, which currently is not the case — the initial Redux address is an empty string.
   */
  const accountAddress = rawAddress?.length ? rawAddress : cachedAddress ?? rawAddress;

  if (cachedStore && cachedAddress === accountAddress) return cachedStore;

  const newStore = createUserAssetsStore(accountAddress);

  if (cachedStore) rebindSubscriptions(cachedStore, newStore);

  userAssetsStoreManager.setState({ address: accountAddress, cachedStore: newStore });
  return newStore;
}

function useUserAssetsStoreInternal(): QueryEnabledUserAssetsState;
function useUserAssetsStoreInternal<T>(selector: Selector<QueryEnabledUserAssetsState, T>, equalityFn?: EqualityFn<T>): T;
function useUserAssetsStoreInternal<T>(
  selector?: Selector<QueryEnabledUserAssetsState, T>,
  equalityFn?: EqualityFn<T>
): QueryEnabledUserAssetsState | T {
  const address = useSelector((state: AppState) => state.settings.accountAddress);
  const store = getOrCreateStore(address);
  return selector ? store(selector, equalityFn) : store();
}

export const useUserAssetsStore: UserAssetsRouter = Object.assign(useUserAssetsStoreInternal, {
  destroy: () => getOrCreateStore().destroy(),
  getInitialState: () => getOrCreateStore().getInitialState(),
  getState: (address?: Address | string) => getOrCreateStore(address).getState(),
  persist,
  setState: (...args: Parameters<UserAssetsRouter['setState']>) => {
    const [partial, replace, address] = args;
    return getOrCreateStore(address).setState(partial, replace);
  },
  subscribe: portableSubscribe,
});

// TODO: Remove this and consolidate into useUserAssetsStore
export const userAssetsStore = useUserAssetsStore;
