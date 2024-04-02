import { useMemo } from 'react';
import { useSearchCurrencyLists } from './useSearchCurrencyLists';
import { useSwapContext } from '../providers/swap-provider';
import { ChainId } from '../types/chains';

export const useAssetsToBuySections = () => {
  const { SwapInputController } = useSwapContext();

  const inputChainId = useMemo(() => {
    return SwapInputController.assetToSell.value?.chainId ?? ChainId.mainnet;
  }, [SwapInputController.assetToSell.value]);

  const outputChainId = useMemo(() => {
    return SwapInputController.outputChainId.value ?? ChainId.mainnet;
  }, [SwapInputController.outputChainId.value]);

  const { results: searchAssetsToBuySections } = useSearchCurrencyLists({
    inputChainId,
    outputChainId,
    assetToSell: SwapInputController.assetToSell.value,
    searchQuery: SwapInputController.searchQuery.value,
    bridge: SwapInputController.outputChainId.value !== SwapInputController.assetToSell.value?.chainId ?? false,
  });

  return searchAssetsToBuySections;
};
