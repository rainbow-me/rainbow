import { useSelector } from 'react-redux';
import { Address } from 'viem';
import reduxStore, { AppState } from '@/redux/store';
import { createStoreFactoryUtils } from '@/state/internal/utils/factoryUtils';
import { createNftsStore } from './createNftsStore';
import { nftsStoreManager } from './nftsStoreManager';
import { QueryEnabledNftsState, NftsRouter, NftsStoreType, NftsState } from './types';

const { persist, portableSubscribe, rebindSubscriptions } = createStoreFactoryUtils<NftsStoreType, Partial<NftsState>>(getOrCreateStore);

function getOrCreateStore(address?: Address | string): NftsStoreType {
  const rawAddress = address?.length ? address : reduxStore.getState().settings.accountAddress;
  const { address: cachedAddress, cachedStore } = nftsStoreManager.getState();

  /**
   * Fallback to ensure an address is always available on app launch, mirroring
   * the behavior in the user assets store.
   */
  const accountAddress = rawAddress?.length ? rawAddress : cachedAddress ?? rawAddress;

  if (cachedStore && cachedAddress === accountAddress) return cachedStore;

  const newStore = createNftsStore(accountAddress);

  if (cachedStore) rebindSubscriptions(cachedStore, newStore);

  nftsStoreManager.setState({ address: accountAddress, cachedStore: newStore });
  return newStore;
}

function useNftsStoreInternal(): QueryEnabledNftsState;
function useNftsStoreInternal<T>(selector: (state: QueryEnabledNftsState) => T, equalityFn?: (a: T, b: T) => boolean): T;
function useNftsStoreInternal<T>(
  selector?: (state: QueryEnabledNftsState) => T,
  equalityFn?: (a: T, b: T) => boolean
): QueryEnabledNftsState | T {
  const address = useSelector((state: AppState) => state.settings.accountAddress);
  const store = getOrCreateStore(address);
  return selector ? store(selector, equalityFn) : store();
}

export const useNftsStore: NftsRouter = Object.assign(useNftsStoreInternal, {
  destroy: () => getOrCreateStore().destroy(),
  getInitialState: () => getOrCreateStore().getInitialState(),
  getState: (address?: Address | string) => getOrCreateStore(address).getState(),
  persist,
  setState: (...args: Parameters<NftsRouter['setState']>) => {
    const [partial, replace, address] = args;
    return getOrCreateStore(address).setState(partial, replace);
  },
  subscribe: portableSubscribe,
});
