import { useSearchCurrencyLists } from './useSearchCurrencyLists';
import { useSwapContext } from '../providers/swap-provider';

export const useAssetsToBuySections = () => {
  const { SwapInputController } = useSwapContext();

  const { results: searchAssetsToBuySections } = useSearchCurrencyLists({
    outputChainId: SwapInputController.outputChainId,
    assetToSell: SwapInputController.assetToSell,
    searchQuery: SwapInputController.searchQuery,
  });

  return searchAssetsToBuySections;
};
