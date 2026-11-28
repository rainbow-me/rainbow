import { useSwapsSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { getUniqueId } from '@/entities/assetId';
import { SOLANA_CHAIN_ID } from '@/features/solana/core/chainId';
import { SOLANA_SWAP_OUTPUTS } from '@/features/solana/core/swap';
import { useSolanaBalancesAddress, useSolanaWalletBalances } from '@/features/solana/data/solanaBalancesStore';
import {
  useSolanaInputSearchQuery,
  useSolanaInputTokenSearch,
  useSolanaOutputTokenSearch,
} from '@/features/solana/data/solanaTokenSearchStore';

export function useSolanaSwapOptions(output: boolean) {
  const enabledAddress = useSolanaBalancesAddress();
  const data = useSolanaWalletBalances(state => state.data);
  const outputQuery = useSwapsSearchStore(state => state.searchQuery);
  const inputQuery = useSolanaInputSearchQuery();
  const useSearchStore = output ? useSolanaOutputTokenSearch : useSolanaInputTokenSearch;
  const query = (output ? outputQuery : inputQuery).trim();
  const results = useSearchStore(state => state.getCacheEntry({ query })?.data);
  const options = !enabledAddress
    ? []
    : (query ? (results ?? []) : SOLANA_SWAP_OUTPUTS).filter(asset => {
        if (output) return true;
        const balance = data?.balances.get(
          getUniqueId(asset.asset.kind === 'native' ? 'So11111111111111111111111111111111111111111' : asset.asset.address, SOLANA_CHAIN_ID)
        );
        return !!balance && !balance.rawUnits;
      });
  return { query, options };
}
