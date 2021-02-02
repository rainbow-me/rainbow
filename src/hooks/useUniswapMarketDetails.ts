import { isEmpty } from 'lodash';
import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { TextInput } from 'react-native';
import useAccountSettings from './useAccountSettings';
import useSlippageDetails from './useSlippageDetails';
import useSwapDetails from './useSwapDetails';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';
import useSwapInputValues from './useSwapInputValues';
import useUniswapPairs from './useUniswapPairs';
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
  inputFieldRef,
  isSavings,
  maxInputBalance,
  outputFieldRef,
  updateInputAmount,
  updateOutputAmount,
}: {
  defaultInputAddress: string;
  inputFieldRef: RefObject<TextInput>;
  isSavings: boolean;
  maxInputBalance: string;
  outputFieldRef: RefObject<TextInput>;
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
  const {
    extraTradeDetails,
    tradeDetails,
    updateExtraTradeDetails,
    updateTradeDetails: updateSwapTradeDetails,
  } = useSwapDetails();
  const { updateSlippage } = useSlippageDetails();

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
    updateSwapTradeDetails(newTradeDetails);
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
        !outputFieldRef?.current?.isFocused()
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
      if (!inputAsExactAmount && !inputFieldRef?.current?.isFocused()) {
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
    updateExtraTradeDetails();
  }, [isMissingCurrency, swapNotNeeded, tradeDetails, updateExtraTradeDetails]);

  useEffect(() => {
    // update slippage
    if (swapNotNeeded || isMissingCurrency) return;
    updateSlippage();
  }, [isMissingCurrency, swapNotNeeded, updateSlippage]);

  return {
    isSufficientLiquidity,
  };
}
