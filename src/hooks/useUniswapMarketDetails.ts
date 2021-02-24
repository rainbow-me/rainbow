import { useCallback, useEffect, useMemo, useState } from 'react';
import useAccountSettings from './useAccountSettings';
import useSwapDetails from './useSwapDetails';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';
import useSwapInputValues from './useSwapInputValues';
import useUniswapPairs from './useUniswapPairs';
import { calculateTradeDetails } from '@rainbow-me/handlers/uniswap';

export default function useUniswapMarketDetails({
  defaultInputAddress,
  isSavings,
}: {
  defaultInputAddress: string;
  isSavings: boolean;
}) {
  const { inputCurrency, outputCurrency } = useSwapInputOutputTokens();
  const {
    inputAmount,
    inputAsExactAmount,
    outputAmount,
  } = useSwapInputValues();
  const {
    tradeDetails,
    updateExtraTradeDetails,
    updateTradeDetails: updateSwapTradeDetails,
  } = useSwapDetails();

  const [isSufficientLiquidity, setIsSufficientLiquidity] = useState(true);
  const { chainId } = useAccountSettings();

  const { allPairs, doneLoadingResults } = useUniswapPairs();
  const swapNotNeeded = useMemo(
    () => isSavings && inputCurrency?.address === defaultInputAddress,
    [defaultInputAddress, inputCurrency, isSavings]
  );

  const isMissingCurrency = !inputCurrency || !outputCurrency;

  const updateTradeDetails = useCallback(() => {
    let updatedInputAmount = inputAmount;
    let updatedInputAsExactAmount = inputAsExactAmount;

    const newTradeDetails = calculateTradeDetails(
      chainId,
      updatedInputAmount,
      outputAmount,
      inputCurrency,
      outputCurrency,
      allPairs,
      updatedInputAsExactAmount
    );

    const hasInsufficientLiquidity = doneLoadingResults && !newTradeDetails;
    setIsSufficientLiquidity(!hasInsufficientLiquidity);
    updateSwapTradeDetails(newTradeDetails);
  }, [
    doneLoadingResults,
    allPairs,
    chainId,
    inputAmount,
    inputAsExactAmount,
    inputCurrency,
    outputAmount,
    outputCurrency,
    updateSwapTradeDetails,
  ]);

  useEffect(() => {
    if (swapNotNeeded || isMissingCurrency) return;
    updateTradeDetails();
  }, [isMissingCurrency, swapNotNeeded, updateTradeDetails]);

  useEffect(() => {
    if (swapNotNeeded || isMissingCurrency || !tradeDetails) return;
    updateExtraTradeDetails();
  }, [isMissingCurrency, swapNotNeeded, tradeDetails, updateExtraTradeDetails]);

  return {
    isSufficientLiquidity,
  };
}
