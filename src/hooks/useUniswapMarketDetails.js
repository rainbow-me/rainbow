import { get } from 'lodash';
import { useCallback } from 'react';
import { calculateTradeDetails } from '../handlers/uniswap';
import {
  convertAmountFromNativeValue,
  convertNumberToString,
  greaterThanOrEqualTo,
  isZero,
  updatePrecisionToDisplay,
} from '../helpers/utilities';
import { logger } from '../utils';
import useAccountSettings from './useAccountSettings';
import useUniswapPairs from './useUniswapPairs';

const DEFAULT_NATIVE_INPUT_AMOUNT = 50;

export default function useUniswapMarketDetails(inputCurrency, outputCurrency) {
  const { chainId } = useAccountSettings();

  const { allPairs } = useUniswapPairs(inputCurrency, outputCurrency);

  const updateTradeDetails = useCallback(
    ({
      inputAmount,
      inputAsExactAmount,
      inputCurrency,
      outputAmount,
      outputCurrency,
    }) => {
      let updatedInputAmount = inputAmount;
      let updatedInputAsExactAmount = inputAsExactAmount;
      const isMissingAmounts = !inputAmount && !outputAmount;

      if (isMissingAmounts) {
        const inputNativePrice = get(
          inputCurrency,
          'native.price.amount',
          null
        );
        updatedInputAmount = convertAmountFromNativeValue(
          DEFAULT_NATIVE_INPUT_AMOUNT,
          inputNativePrice,
          inputCurrency.decimals
        );
        updatedInputAsExactAmount = true;
      }

      return calculateTradeDetails(
        chainId,
        updatedInputAmount,
        outputAmount,
        inputCurrency,
        outputCurrency,
        allPairs,
        updatedInputAsExactAmount
      );
    },
    [allPairs, chainId]
  );

  const calculateInputGivenOutputChange = useCallback(
    ({
      inputAsExactAmount,
      inputCurrency,
      isOutputEmpty,
      isOutputZero,
      maxInputBalance,
      setIsSufficientBalance,
      tradeDetails,
      updateInputAmount,
    }) => {
      if (isOutputEmpty || isOutputZero) {
        updateInputAmount(undefined, undefined, false);
        setIsSufficientBalance(true);
      } else {
        const rawUpdatedInputAmount = tradeDetails?.inputAmount?.toExact();

        const updatedInputAmountDisplay = updatePrecisionToDisplay(
          rawUpdatedInputAmount,
          get(inputCurrency, 'price.value'),
          true
        );
        updateInputAmount(
          rawUpdatedInputAmount,
          updatedInputAmountDisplay,
          inputAsExactAmount
        );

        const isSufficientAmountToTrade = greaterThanOrEqualTo(
          maxInputBalance,
          rawUpdatedInputAmount
        );
        setIsSufficientBalance(isSufficientAmountToTrade);
      }
    },
    []
  );

  const calculateOutputGivenInputChange = useCallback(
    ({
      inputAsExactAmount,
      isInputEmpty,
      isInputZero,
      outputCurrency,
      outputFieldRef,
      tradeDetails,
      updateOutputAmount,
    }) => {
      logger.log('calculate OUTPUT given INPUT change');
      if (
        (isInputEmpty || isInputZero) &&
        outputFieldRef &&
        outputFieldRef.current &&
        !outputFieldRef.current.isFocused()
      ) {
        updateOutputAmount(null, null, true);
      } else {
        const rawUpdatedOutputAmount = tradeDetails?.outputAmount?.toExact();
        if (!isZero(rawUpdatedOutputAmount)) {
          let outputNativePrice = get(outputCurrency, 'price.value', null);
          const updatedOutputAmountDisplay = updatePrecisionToDisplay(
            rawUpdatedOutputAmount,
            outputNativePrice
          );

          updateOutputAmount(
            rawUpdatedOutputAmount,
            updatedOutputAmountDisplay,
            inputAsExactAmount
          );
        }
      }
    },
    []
  );

  const getMarketDetails = useCallback(
    ({
      inputAmount,
      inputAsExactAmount,
      inputCurrency,
      inputFieldRef,
      maxInputBalance,
      nativeCurrency,
      outputAmount,
      outputCurrency,
      outputFieldRef,
      setIsSufficientBalance,
      setSlippage,
      updateExtraTradeDetails,
      updateInputAmount,
      updateOutputAmount,
    }) => {
      const isMissingCurrency = !inputCurrency || !outputCurrency;
      if (isMissingCurrency) return;

      try {
        const tradeDetails = updateTradeDetails({
          inputAmount,
          inputAsExactAmount,
          inputCurrency,
          outputAmount,
          outputCurrency,
        });
        updateExtraTradeDetails({
          inputCurrency,
          nativeCurrency,
          outputCurrency,
          tradeDetails,
        });

        const isMissingAmounts = !inputAmount && !outputAmount;
        if (isMissingAmounts) return;

        // update slippage
        const slippage = convertNumberToString(
          get(tradeDetails, 'executionRateSlippage', 0)
        );
        setSlippage(slippage);

        const newIsSufficientBalance =
          !inputAmount || greaterThanOrEqualTo(maxInputBalance, inputAmount);

        setIsSufficientBalance(newIsSufficientBalance);

        const isInputEmpty = !inputAmount;
        const isOutputEmpty = !outputAmount;

        const isInputZero = Number(inputAmount) === 0;
        const isOutputZero = Number(outputAmount) === 0;

        // update output amount given input amount changes
        if (inputAsExactAmount) {
          calculateOutputGivenInputChange({
            inputAsExactAmount,
            isInputEmpty,
            isInputZero,
            outputCurrency,
            outputFieldRef,
            tradeDetails,
            updateOutputAmount,
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
            inputAsExactAmount,
            inputCurrency,
            isOutputEmpty,
            isOutputZero,
            maxInputBalance,
            setIsSufficientBalance,
            tradeDetails,
            updateInputAmount,
          });
        }
      } catch (error) {
        logger.log('error getting market details', error);
      }
    },
    [
      calculateInputGivenOutputChange,
      calculateOutputGivenInputChange,
      updateTradeDetails,
    ]
  );

  return {
    getMarketDetails,
  };
}
