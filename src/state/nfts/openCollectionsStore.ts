import { Address } from 'viem';
import { createStoreFactoryUtils } from '@/state/internal/utils/factoryUtils';
import { createOpenCollectionsStore } from './createOpenCollectionsStore';
import { openCollectionsStoreManager } from './openCollectionsStoreManager';
import { OpenCollectionsRouter, OpenCollectionsStoreType, OpenCollectionsState } from './types';
import { getAccountAddress, useAccountAddress } from '@/state/wallets/walletsStore';

const { persist, portableSubscribe, rebindSubscriptions } = createStoreFactoryUtils<
  OpenCollectionsStoreType,
  Partial<OpenCollectionsState>
>(getOrCreateStore);

function getOrCreateStore(address?: Address | string): OpenCollectionsStoreType {
  const rawAddress = address?.length ? address : getAccountAddress();
  const { address: cachedAddress, cachedStore } = openCollectionsStoreManager.getState();

  /**
   * Fallback to ensure an address is always available on app launch, mirroring
   * the behavior in the user assets store.
   */
  const accountAddress = rawAddress?.length ? rawAddress : cachedAddress ?? rawAddress;

  if (cachedStore && cachedAddress === accountAddress) return cachedStore;

  const newStore = createOpenCollectionsStore(accountAddress);

  if (cachedStore) rebindSubscriptions(cachedStore, newStore);

  openCollectionsStoreManager.setState({ address: accountAddress, cachedStore: newStore });
  return newStore;
}

function useOpenCollectionsStoreInternal(): OpenCollectionsState;
function useOpenCollectionsStoreInternal<T>(selector: (state: OpenCollectionsState) => T, equalityFn?: (a: T, b: T) => boolean): T;
function useOpenCollectionsStoreInternal<T>(
  selector?: (state: OpenCollectionsState) => T,
  equalityFn?: (a: T, b: T) => boolean
): OpenCollectionsState | T {
  const address = useAccountAddress();
  const store = getOrCreateStore(address);
  return selector ? store(selector, equalityFn) : store();
}

export const useOpenCollectionsStore: OpenCollectionsRouter = Object.assign(useOpenCollectionsStoreInternal, {
  destroy: () => getOrCreateStore().destroy(),
  getInitialState: () => getOrCreateStore().getInitialState(),
  getState: (address?: Address | string) => getOrCreateStore(address).getState(),
  persist,
  setState: (...args: Parameters<OpenCollectionsRouter['setState']>) => {
    const [partial, replace, address] = args;
    return getOrCreateStore(address).setState(partial, replace);
  },
  subscribe: portableSubscribe,
});

export type OpenCollectionsStore = typeof useOpenCollectionsStore;
