import { useSelector } from 'react-redux';
import { Address } from 'viem';
import reduxStore, { AppState } from '@/redux/store';
import { createUserAssetsStore } from './createUserAssetsStore';
import { QueryEnabledUserAssetsState } from './types';
import { userAssetsStoreManager } from './userAssetsStoreManager';

function getOrCreateStore(address?: Address | string): ReturnType<typeof createUserAssetsStore> {
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
  userAssetsStoreManager.setState({ address: accountAddress, cachedStore: newStore });
  return newStore;
}

function useUserAssetsStoreInternal<T>(selector: (state: QueryEnabledUserAssetsState) => T): T {
  const address = useSelector((state: AppState) => state.settings.accountAddress);
  return getOrCreateStore(address)(selector);
}

export const useUserAssetsStore = Object.assign(useUserAssetsStoreInternal, {
  getState: (address?: Address | string) => getOrCreateStore(address).getState(),

  setState: (
    partial:
      | QueryEnabledUserAssetsState
      | Partial<QueryEnabledUserAssetsState>
      | ((state: QueryEnabledUserAssetsState) => QueryEnabledUserAssetsState | Partial<QueryEnabledUserAssetsState>),
    replace?: boolean,
    address?: Address | string
  ) => getOrCreateStore(address).setState(partial, replace),

  subscribe: (listener: (state: QueryEnabledUserAssetsState, prevState: QueryEnabledUserAssetsState) => void, address?: Address | string) =>
    getOrCreateStore(address).subscribe(listener),
});

// TODO: Remove this and consolidate into useUserAssetsStore
export const userAssetsStore = useUserAssetsStore;
