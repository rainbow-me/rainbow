import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { EthereumAddress } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';
import { SwapModalField, updateSwapQuote } from '@rainbow-me/redux/swap';
import { ETH_ADDRESS } from '@rainbow-me/references';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToRawAmount,
  convertNumberToString,
  convertRawAmountToDecimalFormat,
  isZero,
  updatePrecisionToDisplay,
} from '@rainbow-me/utilities';
import { ethereumUtils, logger } from '@rainbow-me/utils'; 
import {
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS,
  getQuote
} from 'rainbow-swaps';
import { Token } from 'src/entities/tokens';

enum DisplayValue {
  input = 'inputAmountDisplay',
  output = 'outputAmountDisplay',
}

const getInputAmount = async (
  outputAmount: string | null,
  inputToken: Token,
  outputToken: Token | null,
  inputPrice: string | null,
  fromAddress: EthereumAddress,
  chainId = 1
) => {
  if (!outputAmount || isZero(outputAmount) || !outputToken) {
    return {
      outputAmount: null,
      outputAmountDisplay: null,
      tradeDetails: null,
    };
  }

  try {
    const buyTokenAddress =
      outputToken?.address === ETH_ADDRESS
        ? ETH_ADDRESS_AGGREGATORS
        : outputToken?.address;
    const sellTokenAddress =
      inputToken?.address === ETH_ADDRESS
        ? ETH_ADDRESS_AGGREGATORS
        : inputToken?.address;

    const buyAmount = convertAmountToRawAmount(
      convertNumberToString(outputAmount),
      inputToken.decimals
    );

    const quoteParams = {
      buyAmount,
      buyTokenAddress,
      chainId: Number(chainId),
      fromAddress,
      sellTokenAddress,
      slippage: 0.5,
    };
    const quote = await getQuote(quoteParams);
    if (!quote){
      return {
        inputAmount: null,
        inputAmountDisplay: null,
        tradeDetails: null,
      };
    }

    const inputAmount = convertRawAmountToDecimalFormat(
      quote.sellAmount.toString(),
      inputToken.decimals
    );

    const inputAmountDisplay =
      inputAmount && inputPrice
        ? updatePrecisionToDisplay(inputAmount, inputPrice)
        : inputAmount
        ? quote.buyAmount
        : null;

    quote.inputTokenDecimals = inputToken.decimals;
    quote.outputTokenDecimals = outputToken.decimals;

    return {
      inputAmount,
      inputAmountDisplay,
      tradeDetails: quote,
    };
  } catch (e) {
    return {
      inputAmount: null,
      inputAmountDisplay: null,
      tradeDetails: null,
    };
  }
};

const getOutputAmount = async (
  inputAmount: string | null,
  inputToken: Token,
  outputToken: Token | null,
  outputPrice: string | null,
  fromAddress: EthereumAddress,
  chainId = 1
) => {
  if (!inputAmount || isZero(inputAmount) || !outputToken) {
    return {
      outputAmount: null,
      outputAmountDisplay: null,
      tradeDetails: null,
    };
  }

  try {
    const buyTokenAddress =
      outputToken?.address === ETH_ADDRESS
        ? ETH_ADDRESS_AGGREGATORS
        : outputToken?.address;
    const sellTokenAddress =
      inputToken?.address === ETH_ADDRESS
        ? ETH_ADDRESS_AGGREGATORS
        : inputToken?.address;

    const sellAmount = convertAmountToRawAmount(
      convertNumberToString(inputAmount),
      inputToken.decimals
    );

    const quoteParams = {
      buyAmount: null || '0',
      buyTokenAddress,
      chainId: Number(chainId),
      fromAddress,
      sellAmount,
      sellTokenAddress,
      slippage: 0.5,
    };
    const quote = await getQuote(quoteParams);
    if (!quote){
      return {
        outputAmount: null,
        outputAmountDisplay: null,
        tradeDetails: null,
      };
    }

    const outputAmount = convertRawAmountToDecimalFormat(
      quote.buyAmount.toString(),
      outputToken.decimals
    );

    const outputAmountDisplay =
      outputAmount && outputPrice
        ? updatePrecisionToDisplay(outputAmount, outputPrice)
        : outputAmount
        ? outputAmount
        : null;

    quote.inputTokenDecimals = inputToken.decimals;
    quote.outputTokenDecimals = outputToken.decimals;

    return {
      outputAmount,
      outputAmountDisplay,
      tradeDetails: quote,
    };
  } catch (e) {
    return {
      outputAmount: null,
      outputAmountDisplay: null,
      tradeDetails: null,
    };
  }
};

const derivedValues: { [key in SwapModalField]: string | null } = {
  [SwapModalField.input]: null,
  [SwapModalField.native]: null,
  [SwapModalField.output]: null,
};

const displayValues: { [key in DisplayValue]: string | null } = {
  [DisplayValue.input]: null,
  [DisplayValue.output]: null,
};

export default function useSwapDerivedOutputs() {
  const dispatch = useDispatch();
  const [result, setResult] = useState({
    derivedValues,
    displayValues,
    doneLoadingReserves: false,
    tradeDetails: null,
  });
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

  const { chainId, accountAddress } = useAccountSettings();

  const getTradeDetails = useCallback(async () => {
    let tradeDetails = null;
    if (!independentValue || !inputCurrency) {
      return {
        derivedValues,
        displayValues,
        doneLoadingReserves: true,
        tradeDetails,
      };
    }
    const inputToken = inputCurrency;
    const outputToken = outputCurrency;

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
      } = await getOutputAmount(
        independentValue,
        inputToken,
        outputToken,
        outputPrice,
        accountAddress,
        chainId
      );
      tradeDetails = newTradeDetails;
      derivedValues[SwapModalField.output] = outputAmount;
      displayValues[DisplayValue.output] =
        outputAmountDisplay?.toString() || null;
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
      } = await getOutputAmount(
        inputAmount,
        inputToken,
        outputToken,
        outputPrice,
        accountAddress,
        chainId
      );
      tradeDetails = newTradeDetails;
      derivedValues[SwapModalField.output] = outputAmount;
      displayValues[DisplayValue.output] =
        outputAmountDisplay?.toString() || null;
    } else {
      if (!outputToken || !inputToken) {
        return {
          derivedValues,
          displayValues,
          doneLoadingReserves: true,
          tradeDetails,
        };
      }
      derivedValues[SwapModalField.output] = independentValue;
      displayValues[DisplayValue.output] = independentValue;

      const {
        inputAmount,
        inputAmountDisplay,
        tradeDetails: newTradeDetails,
      } = await getInputAmount(
        independentValue,
        inputToken,
        outputToken,
        inputPrice,
        accountAddress,
        chainId
      );
      tradeDetails = newTradeDetails;
      derivedValues[SwapModalField.input] = inputAmount || '0';
      // @ts-ignore next-line
      displayValues[DisplayValue.input] = inputAmountDisplay;
      const nativeValue =
        inputPrice && inputAmount
          ? convertAmountToNativeAmount(inputAmount, inputPrice)
          : null;

      derivedValues[SwapModalField.native] = nativeValue;
    }
    return {
      derivedValues,
      displayValues,
      doneLoadingReserves: true,
      tradeDetails,
    };
  }, [
    accountAddress,
    chainId,
    independentField,
    independentValue,
    inputCurrency,
    inputPrice,
    outputCurrency,
    outputPrice,
  ]);

  useMemo(async () => {
    const data = await getTradeDetails();
    dispatch(
      updateSwapQuote({
        derivedValues: data.derivedValues,
        displayValues: data.displayValues,
        tradeDetails: data.tradeDetails,
      })
    );
    // @ts-ignore next-line
    setResult(data);
  }, [dispatch, getTradeDetails]);

  return result;
}
