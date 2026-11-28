import { createBaseStore, createQueryStore, type DeriveGetter } from '@storesjs/stores';

import { useSwapsSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { SOLANA_CHAIN_ID } from '@/features/solana/core/chainId';
import { type SolanaSwapAsset } from '@/features/solana/core/swap';
import { parseSolanaSearchResults } from '@/features/solana/core/tokenSearch';
import { fetchTokenSearch } from '@/features/token-search/data/tokenSearch';
import { time } from '@/framework/core/utils/time';

import { useSolanaBalancesAddress } from './solanaBalancesStore';

// EVM input search normalizes case; Solana mint searches must retain the original text.
export const useSolanaInputSearchQuery = createBaseStore(() => '');

function createSolanaTokenSearchStore(query: ($: DeriveGetter) => string) {
  return createQueryStore<SolanaSwapAsset[] | null, { query: string }>({
    params: { query },
    enabled: $ => !!$(useSolanaBalancesAddress) && !!query($),
    fetcher: async ({ query }, abortController) => {
      if (!query || !useSolanaBalancesAddress.getState()) return null;
      const result = await fetchTokenSearch(
        { query, chainIds: [SOLANA_CHAIN_ID], category: 'CATEGORY_TOKENS', limit: 50 },
        abortController
      );
      return parseSolanaSearchResults(result);
    },
    disableAutoRefetching: true,
    keepPreviousData: true,
    cacheTime: time.seconds(15),
    staleTime: time.minutes(2),
  });
}

export const useSolanaOutputTokenSearch = createSolanaTokenSearchStore($ => $(useSwapsSearchStore, state => state.searchQuery.trim()));
export const useSolanaInputTokenSearch = createSolanaTokenSearchStore($ => $(useSolanaInputSearchQuery).trim());
