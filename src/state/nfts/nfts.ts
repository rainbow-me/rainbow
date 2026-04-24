import { type Address } from 'viem';

import { createStoreFactoryUtils } from '@/state/internal/utils/factoryUtils';
import { getAccountAddress, useAccountAddress } from '@/state/wallets/walletsStore';

import { createNftsStore } from './createNftsStore';
import { nftsStoreManager } from './nftsStoreManager';
import { type NftsRouter, type NftsState, type NftsStoreType, type QueryEnabledNftsState } from './types';

const { persist, portableSubscribe, rebindSubscriptions } = createStoreFactoryUtils<NftsStoreType, Partial<NftsState>>(getOrCreateStore);

function getOrCreateStore(address?: Address | string): NftsStoreType {
  const rawAddress = address?.length ? address : getAccountAddress();
  const { address: cachedAddress, cachedStore } = nftsStoreManager.getState();

  /**
   * Fallback to ensure an address is always available on app launch, mirroring
   * the behavior in the user assets store.
   */
  const accountAddress = rawAddress?.length ? rawAddress : (cachedAddress ?? rawAddress);

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
  const address = useAccountAddress();
  const store = getOrCreateStore(address);
  return selector ? store(selector, equalityFn) : store();
}

export const useNftsStore: NftsRouter = Object.assign(useNftsStoreInternal, {
  getInitialState: () => getOrCreateStore().getInitialState(),
  getState: (address?: Address | string) => getOrCreateStore(address).getState(),
  persist,
  setState: (...args: Parameters<NftsRouter['setState']>) => {
    const [partial, replace, address] = args;
    // @ts-expect-error — zustand v5 narrowed setState into two literal
    // overloads (`replace?: false` + Partial, or `replace: true` + full
    // state). The router's own signature keeps a boolean `replace`, so TS
    // can't pick an overload when forwarding; the forwarder is correct at
    // runtime because v5's impl handles both forms.
    return getOrCreateStore(address).setState(partial, replace);
  },
  subscribe: portableSubscribe,
});
