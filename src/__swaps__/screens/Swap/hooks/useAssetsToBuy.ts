import { useMemo } from 'react';
import { useSearchCurrencyLists } from '@/__swaps__/screens/Swap/hooks/useSearchCurrencyLists';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';

export const useAssetsToBuySections = () => {
  const { SwapInputController } = useSwapContext();

  const { results: searchAssetsToBuySections } = useSearchCurrencyLists({
    outputChainId: SwapInputController.outputChainId,
    assetToSell: SwapInputController.assetToSell,
    searchQuery: SwapInputController.searchQuery,
  });

  return useMemo(() => searchAssetsToBuySections, [searchAssetsToBuySections]);
};
