import { Pair, Token, TokenAmount, Trade } from '@uniswap/sdk';
import { isEmpty } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import useUniswapPairs from './useUniswapPairs';
import { getTokenForCurrency } from '@rainbow-me/handlers/uniswap';
import { AppState } from '@rainbow-me/redux/store';
import { SwapModalField } from '@rainbow-me/redux/swap';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToRawAmount,
  convertNumberToString,
  isZero,
  updatePrecisionToDisplay,
} from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

enum DisplayValue {
  input = 'inputAmountDisplay',
  output = 'outputAmountDisplay',
}

const getOutputAmount = (
  inputAmount: string | null,
  inputToken: Token,
  outputToken: Token | null,
  outputPrice: string | null,
  allPairs: Pair[] | null
) => {
  if (
    !inputAmount ||
    isZero(inputAmount) ||
    !outputToken ||
    !allPairs ||
    isEmpty(allPairs)
  ) {
    return {
      outputAmount: null,
      outputAmountDisplay: null,
      tradeDetails: null,
    };
  }
  const rawInputAmount = convertAmountToRawAmount(
    convertNumberToString(inputAmount),
    inputToken.decimals
  );
  const amountIn = new TokenAmount(inputToken, rawInputAmount);
  const tradeDetails = Trade.bestTradeExactIn(allPairs, amountIn, outputToken, {
    maxNumResults: 1,
  })[0];
  const outputAmount = tradeDetails?.outputAmount?.toFixed() ?? null;
  const outputAmountDisplay =
    outputAmount && outputPrice
      ? updatePrecisionToDisplay(outputAmount, outputPrice)
      : outputAmount
      ? tradeDetails?.outputAmount?.toSignificant(6)
      : null;
  return {
    outputAmount,
    outputAmountDisplay,
    tradeDetails,
  };
};

export default function useSwapDerivedOutputs() {
  const independentField = useSelector(
    (state: AppState) => state.swap.independentField
  );
  const independentValue = useSelector(
    (state: AppState) => state.swap.independentValue
  );
  const inputCurrency = useSelector(
    (state: AppState) => state.swap.inputCurrency
  );
  const outputCurrency = useSelector(
    (state: AppState) => state.swap.outputCurrency
  );
  const genericAssets = useSelector(
    (state: AppState) => state.data.genericAssets
  );

  const inputPrice = ethereumUtils.getAssetPrice(inputCurrency?.address);
  const outputPrice = genericAssets[outputCurrency?.address]?.price?.value;

  const { chainId } = useAccountSettings();
  const { allPairs, doneLoadingReserves } = useUniswapPairs();

  return useMemo(() => {
    let tradeDetails = null;
    const derivedValues: { [key in SwapModalField]: string | null } = {
      [SwapModalField.input]: null,
      [SwapModalField.native]: null,
      [SwapModalField.output]: null,
    };

    const displayValues: { [key in DisplayValue]: string | null } = {
      [DisplayValue.input]: null,
      [DisplayValue.output]: null,
    };

    if (!independentValue || !inputCurrency) {
      return {
        derivedValues,
        displayValues,
        doneLoadingReserves,
        tradeDetails,
      };
    }

    const inputToken = getTokenForCurrency(inputCurrency, chainId);
    const outputToken = outputCurrency
      ? getTokenForCurrency(outputCurrency, chainId)
      : null;

    if (independentField === SwapModalField.input) {
      derivedValues[SwapModalField.input] = independentValue;
      displayValues[DisplayValue.input] = independentValue;

      const nativeValue =
        inputPrice && !isZero(independentValue)
          ? convertAmountToNativeAmount(independentValue, inputPrice)
          : null;

      derivedValues[SwapModalField.native] = nativeValue;
      const {
        outputAmount,
        outputAmountDisplay,
        tradeDetails: newTradeDetails,
      } = getOutputAmount(
        independentValue,
        inputToken,
        outputToken,
        outputPrice,
        allPairs
      );
      tradeDetails = newTradeDetails;
      derivedValues[SwapModalField.output] = outputAmount;
      displayValues[DisplayValue.output] = outputAmountDisplay;
    } else if (independentField === SwapModalField.native) {
      const inputAmount =
        independentValue && !isZero(independentValue) && inputPrice
          ? convertAmountFromNativeValue(
              independentValue,
              inputPrice,
              inputCurrency.decimals
            )
          : null;
      derivedValues[SwapModalField.native] = independentValue;
      derivedValues[SwapModalField.input] = inputAmount;
      const inputAmountDisplay =
        inputAmount && inputPrice
          ? updatePrecisionToDisplay(inputAmount, inputPrice, true)
          : inputAmount;
      displayValues[DisplayValue.input] = inputAmountDisplay;
      const {
        outputAmount,
        outputAmountDisplay,
        tradeDetails: newTradeDetails,
      } = getOutputAmount(
        inputAmount,
        inputToken,
        outputToken,
        outputPrice,
        allPairs
      );
      tradeDetails = newTradeDetails;
      derivedValues[SwapModalField.output] = outputAmount;
      displayValues[DisplayValue.output] = outputAmountDisplay;
    } else {
      if (!outputToken || !inputToken || isEmpty(allPairs)) {
        return {
          derivedValues,
          displayValues,
          doneLoadingReserves,
          tradeDetails,
        };
      }
      derivedValues[SwapModalField.output] = independentValue;
      displayValues[DisplayValue.output] = independentValue;

      if (!isZero(independentValue)) {
        const outputRawAmount = convertAmountToRawAmount(
          convertNumberToString(independentValue),
          outputToken.decimals
        );
        const amountOut = new TokenAmount(outputToken, outputRawAmount);
        tradeDetails = Trade.bestTradeExactOut(
          allPairs,
          inputToken,
          amountOut,
          {
            maxNumResults: 1,
          }
        )[0];
      }

      const inputAmountExact = tradeDetails?.inputAmount?.toExact() ?? null;
      const inputAmount = tradeDetails?.inputAmount?.toSignificant(6) ?? null;

      derivedValues[SwapModalField.input] = inputAmount;
      const inputAmountDisplay =
        inputAmount && inputPrice
          ? updatePrecisionToDisplay(inputAmount, inputPrice, true)
          : inputAmount;
      displayValues[DisplayValue.input] = inputAmountDisplay;

      const nativeValue =
        inputPrice && inputAmountExact
          ? convertAmountToNativeAmount(inputAmountExact, inputPrice)
          : null;

      derivedValues[SwapModalField.native] = nativeValue;
    }
    return { derivedValues, displayValues, doneLoadingReserves, tradeDetails };
  }, [
    allPairs,
    chainId,
    doneLoadingReserves,
    independentField,
    independentValue,
    inputCurrency,
    inputPrice,
    outputCurrency,
    outputPrice,
  ]);
}
