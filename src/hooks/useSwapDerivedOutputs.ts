import {
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS,
  getQuote,
  Quote,
  QuoteError,
} from '@rainbow-me/swaps';
import { useEffect, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NativeModules } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IS_APK_BUILD, IS_TESTING } from 'react-native-dotenv';
import { useDispatch, useSelector } from 'react-redux';
import { Token } from '../entities/tokens';
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
import { ethereumUtils } from '@rainbow-me/utils';
import Logger from '@rainbow-me/utils/logger';

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
      outputToken.decimals
    );

    const quoteParams = {
      buyAmount,
      buyTokenAddress,
      chainId: Number(chainId),
      fromAddress,
      sellTokenAddress,
      slippage: IS_TESTING !== 'true' ? 1 : 5, // Add 5% slippage for testing to prevent flaky tests
    };

    // @ts-ignore About to get quote
    const quote: Quote = await getQuote(quoteParams);

    if (!quote || !quote.sellAmount) {
      const quoteError = (quote as unknown) as QuoteError;
      if (quoteError.error) {
        Logger.log('Quote Error', {
          code: quoteError.error_code,
          msg: quoteError.message,
        });
      }
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
  outputPrice: string | number | null | undefined,
  slippage: number,
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
      slippage: IS_TESTING !== 'true' ? slippage : 5, // Add 5% slippage for testing to prevent flaky tests
    };

    // @ts-ignore About to get quote
    const quote: Quote = await getQuote(quoteParams);

    if (!quote || !quote.buyAmount) {
      const quoteError = (quote as unknown) as QuoteError;
      if (quoteError.error) {
        Logger.log('Quote Error', {
          code: quoteError.error_code,
          msg: quoteError.message,
        });
      }
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
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState({
    derivedValues,
    displayValues,
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
  const slippageInBips = useSelector(
    (state: AppState) => state.swap.slippageInBips
  );
  const genericAssets = useSelector(
    (state: AppState) => state.data.genericAssets
  );

  const inputPrice = ethereumUtils.getAssetPrice(inputCurrency?.address);
  const outputPrice = genericAssets[outputCurrency?.address]?.price?.value;

  const { chainId, accountAddress } = useAccountSettings();

  useEffect(() => {
    const getTradeDetails = async () => {
      let tradeDetails = null;
      if (!independentValue || !inputCurrency) {
        setResult({
          derivedValues,
          displayValues,
          tradeDetails,
        });
        return;
      }
      setLoading(true);
      const inputToken = inputCurrency;
      const outputToken = outputCurrency;
      const slippagePercentage = slippageInBips / 100;

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
          slippagePercentage,
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
          slippagePercentage,
          accountAddress,
          chainId
        );
        tradeDetails = newTradeDetails;
        derivedValues[SwapModalField.output] = outputAmount;
        displayValues[DisplayValue.output] =
          outputAmountDisplay?.toString() || null;
      } else {
        if (!outputToken || !inputToken) {
          setLoading(false);
          setResult({
            derivedValues,
            displayValues,
            tradeDetails,
          });
          return;
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
          inputPrice.toString(),
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

      const data = {
        derivedValues,
        displayValues,
        doneLoadingReserves: true,
        tradeDetails,
      };

      dispatch(
        updateSwapQuote({
          derivedValues: data.derivedValues,
          displayValues: data.displayValues,
          tradeDetails: data.tradeDetails,
        })
      );
      // @ts-ignore next-line
      setResult(data);
      setLoading(false);
    };

    getTradeDetails();
  }, [
    accountAddress,
    chainId,
    dispatch,
    independentField,
    independentValue,
    inputCurrency,
    inputPrice,
    outputCurrency,
    outputPrice,
    slippageInBips,
  ]);

  return {
    loading,
    result,
  };
}
