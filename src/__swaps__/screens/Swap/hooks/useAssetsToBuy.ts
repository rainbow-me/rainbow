import { ParsedAsset } from '@/__swaps__/screens/Swap/types/assets';
import { isLowerCaseMatch } from '@/__swaps__/screens/Swap/utils/strings';
import { useDebounce } from '@/__swaps__/screens/Swap/hooks/useDebounce';
import { useSearchCurrencyLists } from './useSearchCurrencyLists';
import { useSwapAssetStore } from '../state/assets';

export const isSameAsset = (a1: Pick<ParsedAsset, 'chainId' | 'address'>, a2: Pick<ParsedAsset, 'chainId' | 'address'>) =>
  +a1.chainId === +a2.chainId && isLowerCaseMatch(a1.address, a2.address);

export const useAssetsToBuySections = () => {
  const { searchFilter, assetToSell, assetToBuy, outputChainId } = useSwapAssetStore();

  const debouncedSearchFilter = useDebounce(searchFilter, 200);

  const { results: searchAssetsToBuySections } = useSearchCurrencyLists({
    inputChainId: assetToSell?.chainId,
    outputChainId,
    assetToSell,
    searchQuery: debouncedSearchFilter,
    bridge: (assetToSell && assetToBuy && assetToBuy.chainId !== assetToSell.chainId) ?? false,
  });

  return searchAssetsToBuySections;
};
