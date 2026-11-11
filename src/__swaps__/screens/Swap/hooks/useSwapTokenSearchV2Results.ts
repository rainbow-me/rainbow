import { useRef } from 'react';

import { useSwapsSearchStore, useSwapTokenSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { ChainId } from '@/features/network/types/backendNetworks';
import { type SwapSearchResults } from '@/features/token-search/core/tokenSearch';
import { useSwapsStore } from '@/state/swaps/swapsStore';

/**
 * What the swap list shows from the backend token search while `isActive`:
 * - `undefined` until it answers the first query after the field was empty, so the list keeps the default list;
 * - while a query loads, the previous query's results;
 * - after a request fails, the last results answered on the same output chain since the field was cleared, or `null`.
 */
export function useSwapTokenSearchV2Results(isActive: boolean): SwapSearchResults | null | undefined {
  const query = useSwapsSearchStore(state => state.searchQuery.trim());
  const chainId = useSwapsStore(state => state.selectedOutputChainId ?? ChainId.mainnet);
  const shown = useSwapTokenSearchStore(state => state.getData());
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
  return shown ?? undefined;
}
