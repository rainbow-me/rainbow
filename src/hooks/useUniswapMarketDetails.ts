import { useEffect, useMemo } from 'react';
import useSwapDetails from './useSwapDetails';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';

export default function useUniswapMarketDetails({
  defaultInputAddress,
  isSavings,
}: {
  defaultInputAddress: string;
  isSavings: boolean;
}) {
  const { inputCurrency, outputCurrency } = useSwapInputOutputTokens();
  const { tradeDetails, updateExtraTradeDetails } = useSwapDetails();

  const swapNotNeeded = useMemo(
    () => isSavings && inputCurrency?.address === defaultInputAddress,
    [defaultInputAddress, inputCurrency, isSavings]
  );

  const isMissingCurrency = !inputCurrency || !outputCurrency;

  useEffect(() => {
    if (swapNotNeeded || isMissingCurrency || !tradeDetails) return;
    updateExtraTradeDetails();
  }, [isMissingCurrency, swapNotNeeded, tradeDetails, updateExtraTradeDetails]);
}
