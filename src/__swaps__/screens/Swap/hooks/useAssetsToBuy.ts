import { useEffect, useMemo } from 'react';
import { AssetToBuySection, useSearchCurrencyLists } from '@/__swaps__/screens/Swap/hooks/useSearchCurrencyLists';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { useSharedValue } from 'react-native-reanimated';

export const useAssetsToBuySections = () => {
  const { SwapInputController } = useSwapContext();
  const results = useSharedValue<AssetToBuySection[]>([]);

  const { results: searchAssetsToBuySections } = useSearchCurrencyLists({
    outputChainId: SwapInputController.outputChainId,
    assetToSell: SwapInputController.assetToSell,
    searchQuery: SwapInputController.searchQuery,
  });

  useEffect(() => {
    results.value = searchAssetsToBuySections;
  }, [results, searchAssetsToBuySections]);

  const x = useMemo(() => searchAssetsToBuySections, [searchAssetsToBuySections]);

  return results;
};
