import { useDebounce } from '@/__swaps__/screens/Swap/hooks/useDebounce';
import { useSearchCurrencyLists } from './useSearchCurrencyLists';
import { useSwapAssetStore } from '../state/assets';

export const useAssetsToBuySections = () => {
  const { searchFilter, assetToSell, outputChainId } = useSwapAssetStore();
  const debouncedSearchFilter = useDebounce(searchFilter, 200);

  const { results: searchAssetsToBuySections } = useSearchCurrencyLists({
    inputChainId: assetToSell?.chainId,
    outputChainId,
    assetToSell,
    searchQuery: debouncedSearchFilter,
    bridge: outputChainId !== assetToSell?.chainId ?? false,
  });

  return searchAssetsToBuySections;
};
