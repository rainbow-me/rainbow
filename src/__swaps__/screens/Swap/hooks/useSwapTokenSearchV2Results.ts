import { useRef } from 'react';

import {
  isSwapTokenSearchV2Active,
  selectSwapTokenSearchChainId,
  selectSwapTokenSearchQuery,
  useSwapsSearchStore,
  useSwapTokenSearchStore,
} from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { type SwapSearchResults } from '@/features/token-search/core/tokenSearch';
import { useTokenSearchV2EnabledStore } from '@/features/token-search/data/tokenSearch';
import { useSwapsStore } from '@/state/swaps/swapsStore';

/**
 * What the swap list shows from the backend token search, while {@link isSwapTokenSearchV2Active}:
 * - `undefined` until it answers the first query after the field was empty, so the list keeps the default list;
 * - while a query loads, the last answer since the field was cleared;
 * - after a request fails, that answer when it is for the same output chain, otherwise `null`.
 */
export function useSwapTokenSearchV2Results(): SwapSearchResults | null | undefined {
  const query = useSwapsSearchStore(selectSwapTokenSearchQuery);
  const chainId = useSwapsStore(selectSwapTokenSearchChainId);
  const isActive = isSwapTokenSearchV2Active(useTokenSearchV2EnabledStore(), query);
  const answered = useSwapTokenSearchStore(state => state.getCacheEntry({ query, chainId })?.data);
  const failed = useSwapTokenSearchStore(state => state.getStatus('isError'));
  // A failed request moves the store to its query, which has no data, so the last answer is kept here. It includes
  // answers served from the cache, which never reach the store's callbacks.
  const lastAnswered = useRef<{ chainId: ChainId; results: SwapSearchResults } | null>(null);

  if (!isActive) {
    lastAnswered.current = null;
    return undefined;
  }
  if (answered) {
    lastAnswered.current = { chainId, results: answered };
    return answered;
  }
  if (failed) return lastAnswered.current?.chainId === chainId ? lastAnswered.current.results : null;
  return lastAnswered.current?.results;
}
