import { isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useAccountSettings from './useAccountSettings';
import useSwapDetails from './useSwapDetails';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';
import useSwapInputValues from './useSwapInputValues';
import useUniswapPairs from './useUniswapPairs';
import { calculateTradeDetails } from '@rainbow-me/handlers/uniswap';
import { convertAmountFromNativeValue, isZero } from '@rainbow-me/utilities';

const DEFAULT_NATIVE_INPUT_AMOUNT = 50;

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

  const isMissingAmounts =
    (isEmpty(inputAmount) || isZero(inputAmount || 0)) &&
    (isEmpty(outputAmount) || isZero(outputAmount || 0));

  const isMissingCurrency = !inputCurrency || !outputCurrency;

  const updateTradeDetails = useCallback(() => {
    let updatedInputAmount = inputAmount;
    let updatedInputAsExactAmount = inputAsExactAmount;

    if (isMissingAmounts) {
      updatedInputAmount = convertAmountFromNativeValue(
        DEFAULT_NATIVE_INPUT_AMOUNT,
        inputCurrency?.native?.price?.amount || null,
        inputCurrency.decimals
      );
      updatedInputAsExactAmount = true;
    }

    const newTradeDetails = calculateTradeDetails(
      chainId,
      updatedInputAmount,
      outputAmount,
      inputCurrency,
      outputCurrency,
      allPairs,
      updatedInputAsExactAmount
    );

    const hasInsufficientLiquidity =
      doneLoadingResults && (isEmpty(allPairs) || !newTradeDetails);
    setIsSufficientLiquidity(!hasInsufficientLiquidity);
    if (newTradeDetails) {
      updateSwapTradeDetails(newTradeDetails);
    }
  }, [
    doneLoadingResults,
    allPairs,
    chainId,
    inputAmount,
    inputAsExactAmount,
    inputCurrency,
    isMissingAmounts,
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
