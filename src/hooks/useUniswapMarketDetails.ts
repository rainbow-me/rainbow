import { Trade } from '@uniswap/sdk2';
import { get, isNil } from 'lodash';
import { useCallback } from 'react';
import {
  calculateTradeDetails,
  calculateTradeDetailsV2,
} from '../handlers/uniswap';
import {
  convertAmountFromNativeValue,
  convertNumberToString,
  convertRawAmountToDecimalFormat,
  greaterThanOrEqualTo,
  isZero,
  updatePrecisionToDisplay,
} from '../helpers/utilities';
import { logger } from '../utils';
import useAccountSettings from './useAccountSettings';
import useUniswapCurrencyReserves from './useUniswapCurrencyReserves';
import useUniswapMarketPrice from './useUniswapMarketPrice';
import useUniswapPairs from './useUniswapPairs';

const DEFAULT_NATIVE_INPUT_AMOUNT = 50;

function updateInputsUniswapV1({
  calculateInputGivenOutputChange,
  calculateOutputGivenInputChange,
  inputAmount,
  inputAsExactAmount,
  inputCurrency,
  inputFieldRef,
  maxInputBalance,
  outputAmount,
  outputCurrency,
  outputFieldRef,
  setIsSufficientBalance,
  setSlippage,
  tradeDetailsV1,
  updateInputAmount,
  updateOutputAmount,
}) {
  const isMissingAmounts = !inputAmount && !outputAmount;
  if (isMissingAmounts) return;

  const { decimals: inputDecimals } = inputCurrency;
  const { decimals: outputDecimals } = outputCurrency;

  // update slippage
  const slippage = convertNumberToString(
    get(tradeDetailsV1, 'executionRateSlippage', 0)
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
      inputCurrency,
      isInputEmpty,
      isInputZero,
      outputCurrency,
      outputDecimals,
      outputFieldRef,
      tradeDetails: tradeDetailsV1,
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
      inputDecimals,
      isOutputEmpty,
      isOutputZero,
      maxInputBalance,
      setIsSufficientBalance,
      tradeDetails: tradeDetailsV1,
      updateInputAmount,
    });
  }
}

export default function useUniswapMarketDetails() {
  const { chainId } = useAccountSettings();
  const { getMarketPrice } = useUniswapMarketPrice();
  const { allPairs, inputToken, outputToken } = useUniswapPairs();

  const { inputReserve, outputReserve } = useUniswapCurrencyReserves();

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
        const inputNativePrice = getMarketPrice(inputCurrency, outputCurrency);
        updatedInputAmount = convertAmountFromNativeValue(
          DEFAULT_NATIVE_INPUT_AMOUNT,
          inputNativePrice,
          inputCurrency.decimals
        );
        updatedInputAsExactAmount = true;
      }

      const tradeDetailsV2 = calculateTradeDetailsV2(
        inputAmount,
        outputAmount,
        inputToken,
        outputToken,
        allPairs,
        updatedInputAsExactAmount
      );

      const tradeDetailsV1 = calculateTradeDetails(
        chainId,
        updatedInputAmount,
        inputCurrency,
        inputReserve,
        outputAmount,
        outputCurrency,
        outputReserve,
        updatedInputAsExactAmount
      );
      return {
        v1: tradeDetailsV1,
        v2: tradeDetailsV2,
      };
    },
    [
      chainId,
      getMarketPrice,
      inputReserve,
      inputToken,
      outputReserve,
      outputToken,
      allPairs,
    ]
  );

  const calculateInputGivenOutputChange = useCallback(
    ({
      inputAsExactAmount,
      inputCurrency,
      inputDecimals,
      isOutputEmpty,
      isOutputZero,
      maxInputBalance,
      setIsSufficientBalance,
      tradeDetails,
      updateInputAmount,
    }) => {
      if (isOutputEmpty || isOutputZero) {
        updateInputAmount();
        setIsSufficientBalance(true);
      } else {
        const updatedInputAmount = get(tradeDetails, 'inputAmount.amount');
        const rawUpdatedInputAmount = convertRawAmountToDecimalFormat(
          updatedInputAmount,
          inputDecimals
        );

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
      inputCurrency,
      isInputEmpty,
      isInputZero,
      outputCurrency,
      outputDecimals,
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
        const updatedOutputAmount = get(tradeDetails, 'outputAmount.amount');
        const rawUpdatedOutputAmount = convertRawAmountToDecimalFormat(
          updatedOutputAmount,
          outputDecimals
        );
        if (!isZero(rawUpdatedOutputAmount)) {
          let outputNativePrice = get(outputCurrency, 'price.value', null);
          if (isNil(outputNativePrice)) {
            outputNativePrice = getMarketPrice(
              inputCurrency,
              outputCurrency,
              false
            );
          }
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
    [getMarketPrice]
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
      const isMissingReserves =
        (get(inputCurrency, 'address') !== 'eth' && !inputReserve) ||
        (get(outputCurrency, 'address') !== 'eth' && !outputReserve);
      if (isMissingCurrency || isMissingReserves) return;

      try {
        const {
          v1: tradeDetailsV1,
          v2: tradeDetailsV2,
        }: { v1: any; v2: Trade | null } = updateTradeDetails({
          inputAmount,
          inputAsExactAmount,
          inputCurrency,
          outputAmount,
          outputCurrency,
        });

        const fallbackToV1 = false; // TODO
        if (!fallbackToV1) {
          // setSlippage(tradeDetailsV2.slippage.toFixed(2).toString());

          if (inputAsExactAmount) {
            updateOutputAmount(
              tradeDetailsV2?.outputAmount?.toExact(),
              tradeDetailsV2?.outputAmount?.toExact(), // todo
              true
            );
          }
        } else {
          updateExtraTradeDetails({
            inputCurrency,
            nativeCurrency,
            outputCurrency,
            tradeDetails: tradeDetailsV1,
          });

          updateInputsUniswapV1({
            calculateInputGivenOutputChange,
            calculateOutputGivenInputChange,
            inputAmount,
            inputAsExactAmount,
            inputCurrency,
            inputFieldRef,
            maxInputBalance,
            outputAmount,
            outputCurrency,
            outputFieldRef,
            setIsSufficientBalance,
            setSlippage,
            tradeDetailsV1,
            updateInputAmount,
            updateOutputAmount,
          });
        }
      } catch (error) {
        logger.log('error getting market details', error);
      }
    },
    [
      calculateInputGivenOutputChange,
      calculateOutputGivenInputChange,
      inputReserve,
      outputReserve,
      updateTradeDetails,
    ]
  );

  return {
    getMarketDetails,
  };
}
