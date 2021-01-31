import { Trade } from '@uniswap/sdk';
import { isEmpty } from 'lodash';
import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { TextInput } from 'react-native';
import useAccountSettings from './useAccountSettings';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';
import useSwapInputValues from './useSwapInputValues';
import useUniswapPairs from './useUniswapPairs';
import { Asset } from '@rainbow-me/entities';
import { calculateTradeDetails } from '@rainbow-me/handlers/uniswap';
import {
  convertAmountFromNativeValue,
  greaterThanOrEqualTo,
  isZero,
  updatePrecisionToDisplay,
} from '@rainbow-me/utilities';
import logger from 'logger';

const DEFAULT_NATIVE_INPUT_AMOUNT = 50;

export default function useUniswapMarketDetails({
  defaultInputAddress,
  extraTradeDetails,
  inputFieldRef,
  isSavings,
  maxInputBalance,
  nativeCurrency,
  outputFieldRef,
  setSlippage,
  updateExtraTradeDetails,
  updateInputAmount,
  updateOutputAmount,
}: {
  defaultInputAddress: string;
  extraTradeDetails: { outputPriceValue: string };
  inputFieldRef: RefObject<TextInput>;
  isSavings: boolean;
  maxInputBalance: string;
  nativeCurrency: string;
  outputFieldRef: RefObject<TextInput>;
  setSlippage: (slippage: number) => void;
  updateExtraTradeDetails: (extraTradeDetails: {
    inputCurrency: Asset;
    nativeCurrency: string;
    outputCurrency: Asset;
    tradeDetails: Trade | null;
  }) => void;
  updateInputAmount: (
    newInputAmount: string | undefined,
    newAmountDisplay: string | undefined,
    newInputAsExactAmount?: boolean,
    newIsMax?: boolean
  ) => void;
  updateOutputAmount: (
    newOutputAmount: string | null,
    newAmountDisplay: string | null,
    newInputAsExactAmount?: boolean
  ) => void;
}) {
  const { inputCurrency, outputCurrency } = useSwapInputOutputTokens();
  const {
    inputAmount,
    inputAsExactAmount,
    outputAmount,
    swapUpdateIsSufficientBalance,
  } = useSwapInputValues();

  const [isSufficientLiquidity, setIsSufficientLiquidity] = useState(true);
  const [tradeDetails, setTradeDetails] = useState<Trade | null>(null);
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

    setTradeDetails(newTradeDetails);
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
  ]);

  const calculateInputGivenOutputChange = useCallback(
    ({ isOutputEmpty, isOutputZero }) => {
      if (isOutputEmpty || isOutputZero) {
        updateInputAmount(undefined, undefined, false);
        swapUpdateIsSufficientBalance(true);
      } else {
        if (!tradeDetails) return;
        const rawUpdatedInputAmount = tradeDetails?.inputAmount?.toExact();

        const updatedInputAmountDisplay = updatePrecisionToDisplay(
          rawUpdatedInputAmount,
          inputCurrency?.price?.value,
          true
        );
        updateInputAmount(
          rawUpdatedInputAmount,
          updatedInputAmountDisplay,
          inputAsExactAmount
        );

        const isSufficientAmountToTrade =
          !rawUpdatedInputAmount ||
          greaterThanOrEqualTo(maxInputBalance, rawUpdatedInputAmount);
        swapUpdateIsSufficientBalance(isSufficientAmountToTrade);
      }
    },
    [
      inputAsExactAmount,
      inputCurrency,
      maxInputBalance,
      swapUpdateIsSufficientBalance,
      tradeDetails,
      updateInputAmount,
    ]
  );

  const calculateOutputGivenInputChange = useCallback(
    ({ isInputEmpty, isInputZero }) => {
      logger.log('calculate OUTPUT given INPUT change');
      if (
        (isInputEmpty || isInputZero) &&
        outputFieldRef &&
        outputFieldRef.current &&
        !outputFieldRef.current.isFocused()
      ) {
        updateOutputAmount(null, null, true);
      } else {
        if (!tradeDetails) return;
        const rawUpdatedOutputAmount = tradeDetails?.outputAmount?.toExact();
        if (!isZero(rawUpdatedOutputAmount)) {
          const { outputPriceValue } = extraTradeDetails;
          const updatedOutputAmountDisplay = updatePrecisionToDisplay(
            rawUpdatedOutputAmount,
            outputPriceValue
          );

          updateOutputAmount(
            rawUpdatedOutputAmount,
            updatedOutputAmountDisplay,
            inputAsExactAmount
          );
        }
      }
    },
    [
      extraTradeDetails,
      inputAsExactAmount,
      outputFieldRef,
      tradeDetails,
      updateOutputAmount,
    ]
  );

  const updateInputOutputAmounts = useCallback(() => {
    try {
      if (isMissingAmounts) return;

      const newIsSufficientBalance =
        !inputAmount || greaterThanOrEqualTo(maxInputBalance, inputAmount);

      swapUpdateIsSufficientBalance(newIsSufficientBalance);

      const isInputEmpty = !inputAmount;
      const isOutputEmpty = !outputAmount;

      const isInputZero = Number(inputAmount) === 0;
      const isOutputZero = Number(outputAmount) === 0;

      // update output amount given input amount changes
      if (inputAsExactAmount) {
        calculateOutputGivenInputChange({
          isInputEmpty,
          isInputZero,
        });
      }

      // update input amount given output amount changes
      if (
        !inputAsExactAmount &&
        inputFieldRef &&
        inputFieldRef.current &&
        !inputFieldRef.current.isFocused()
      ) {
        calculateInputGivenOutputChange({
          isOutputEmpty,
          isOutputZero,
        });
      }
    } catch (error) {
      logger.log('error getting market details', error);
    }
  }, [
    calculateInputGivenOutputChange,
    calculateOutputGivenInputChange,
    inputAmount,
    inputAsExactAmount,
    inputFieldRef,
    isMissingAmounts,
    maxInputBalance,
    outputAmount,
    swapUpdateIsSufficientBalance,
  ]);

  useEffect(() => {
    if (swapNotNeeded || isMissingCurrency) return;
    updateTradeDetails();
  }, [isMissingCurrency, swapNotNeeded, updateTradeDetails]);

  useEffect(() => {
    if (swapNotNeeded || isMissingCurrency) return;
    updateInputOutputAmounts();
  }, [isMissingCurrency, swapNotNeeded, updateInputOutputAmounts]);

  useEffect(() => {
    if (swapNotNeeded || isMissingCurrency || !tradeDetails) return;
    updateExtraTradeDetails({
      inputCurrency,
      nativeCurrency,
      outputCurrency,
      tradeDetails,
    });
  }, [
    inputCurrency,
    isMissingCurrency,
    nativeCurrency,
    outputCurrency,
    swapNotNeeded,
    tradeDetails,
    updateExtraTradeDetails,
  ]);

  useEffect(() => {
    // update slippage
    if (swapNotNeeded || isMissingCurrency) return;
    setSlippage(
      tradeDetails?.priceImpact && !isMissingAmounts
        ? Number(tradeDetails?.priceImpact?.toFixed(2).toString()) * 100
        : 0
    );
  }, [
    isMissingAmounts,
    isMissingCurrency,
    setSlippage,
    swapNotNeeded,
    tradeDetails,
  ]);

  return {
    isSufficientLiquidity,
    tradeDetails,
  };
}
