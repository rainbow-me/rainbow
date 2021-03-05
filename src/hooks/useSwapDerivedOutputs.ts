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
} from '@rainbow-me/utilities';

const getOutputAmount = (
  inputAmount: string | null,
  inputToken: Token,
  outputToken: Token | null,
  allPairs: Pair[] | null
) => {
  if (!inputAmount || !outputToken || !allPairs || isEmpty(allPairs)) {
    return {
      outputAmount: null,
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
  const outputAmount = tradeDetails?.outputAmount?.toSignificant(6) ?? null;
  return {
    outputAmount,
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

  const inputPrice = genericAssets[inputCurrency?.address]?.price?.value;

  const { chainId } = useAccountSettings();
  const { allPairs } = useUniswapPairs();

  return useMemo(() => {
    let tradeDetails = null;
    const derivedValues: { [key in SwapModalField]: string | null } = {
      [SwapModalField.input]: null,
      [SwapModalField.native]: null,
      [SwapModalField.output]: null,
    };

    if (!independentValue || !inputCurrency) {
      return { derivedValues, tradeDetails };
    }

    const inputToken = getTokenForCurrency(inputCurrency, chainId);
    const outputToken = outputCurrency
      ? getTokenForCurrency(outputCurrency, chainId)
      : null;

    if (independentField === SwapModalField.input) {
      derivedValues[SwapModalField.input] = independentValue;
      const nativeValue = inputPrice
        ? convertAmountToNativeAmount(independentValue, inputPrice)
        : null;
      derivedValues[SwapModalField.native] = nativeValue;
      const { outputAmount, tradeDetails: newTradeDetails } = getOutputAmount(
        independentValue,
        inputToken,
        outputToken,
        allPairs
      );
      tradeDetails = newTradeDetails;
      derivedValues[SwapModalField.output] = outputAmount;
    } else if (independentField === SwapModalField.native) {
      const inputAmountValue =
        independentValue && inputPrice
          ? convertAmountFromNativeValue(
              independentValue,
              inputPrice,
              inputCurrency.decimals
            )
          : null;
      derivedValues[SwapModalField.native] = independentValue;
      derivedValues[SwapModalField.input] = inputAmountValue;
      const { outputAmount, tradeDetails: newTradeDetails } = getOutputAmount(
        inputAmountValue,
        inputToken,
        outputToken,
        allPairs
      );
      tradeDetails = newTradeDetails;
      derivedValues[SwapModalField.output] = outputAmount;
    } else {
      if (!outputToken || !inputToken || isEmpty(allPairs)) {
        return { derivedValues, tradeDetails };
      }
      const outputRawAmount = convertAmountToRawAmount(
        convertNumberToString(independentValue),
        outputToken.decimals
      );
      const amountOut = new TokenAmount(outputToken, outputRawAmount);
      tradeDetails = Trade.bestTradeExactOut(allPairs, inputToken, amountOut, {
        maxNumResults: 1,
      })[0];

      const inputAmountExact = tradeDetails?.inputAmount?.toExact() ?? null;
      const inputAmount = tradeDetails?.inputAmount?.toSignificant(6) ?? null;

      derivedValues[SwapModalField.input] = inputAmount;
      derivedValues[SwapModalField.output] = independentValue;

      const nativeValue = inputPrice
        ? convertAmountToNativeAmount(inputAmountExact, inputPrice)
        : null;

      derivedValues[SwapModalField.native] = nativeValue;
    }
    return { derivedValues, tradeDetails };
  }, [
    allPairs,
    chainId,
    independentField,
    independentValue,
    inputCurrency,
    inputPrice,
    outputCurrency,
  ]);
}
