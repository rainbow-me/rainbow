import {
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS,
  getQuote,
  Quote,
  QuoteError,
} from '@rainbow-me/swaps';
import { useCallback, useMemo } from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IS_APK_BUILD, IS_TESTING } from 'react-native-dotenv';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Token } from '../entities/tokens';
import useAccountSettings from './useAccountSettings';
import { analytics } from '@/analytics';
import { EthereumAddress } from '@/entities';
import { isNativeAsset } from '@/handlers/assets';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import isTestFlight from '@/helpers/isTestFlight';
import { AppState } from '@/redux/store';
import { Source, SwapModalField, updateSwapQuote } from '@/redux/swap';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertAmountToRawAmount,
  convertNumberToString,
  convertRawAmountToDecimalFormat,
  isZero,
  updatePrecisionToDisplay,
} from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import Logger from '@/utils/logger';

const SWAP_POLLING_INTERVAL = 5000;
enum DisplayValue {
  input = 'inputAmountDisplay',
  output = 'outputAmountDisplay',
  native = 'nativeAmountDisplay',
}

const getSource = (source: Source | null) => {
  if (source === Source.AggregatorRainbow) return null;
  return source;
};

const getInputAmount = async (
  outputAmount: string | null,
  inputToken: Token,
  outputToken: Token | null,
  inputPrice: string | null,
  slippage: number,
  source: Source | null,
  fromAddress: EthereumAddress,
  chainId = 1
) => {
  if (!outputAmount || isZero(outputAmount) || !outputToken) {
    return {
      inputAmount: null,
      inputAmountDisplay: null,
      tradeDetails: null,
    };
  }

  try {
    const network = ethereumUtils.getNetworkFromChainId(chainId);
    const buyTokenAddress = isNativeAsset(outputToken?.address, network)
      ? ETH_ADDRESS_AGGREGATORS
      : outputToken?.address;
    const sellTokenAddress = isNativeAsset(inputToken?.address, network)
      ? ETH_ADDRESS_AGGREGATORS
      : inputToken?.address;

    const buyAmount = convertAmountToRawAmount(
      convertNumberToString(outputAmount),
      outputToken.decimals
    );
    const realSource = getSource(source);
    const quoteParams = {
      buyAmount,
      buyTokenAddress,
      chainId: Number(chainId),
      fromAddress,
      sellTokenAddress,
      // Add 5% slippage for testing to prevent flaky tests
      slippage: IS_TESTING !== 'true' ? slippage : 5,
      source: realSource,
    };

    const rand = Math.floor(Math.random() * 100);
    Logger.debug('Getting quote ', rand, { quoteParams });
    // @ts-ignore About to get quote
    const quote: Quote = await getQuote(quoteParams);
    Logger.debug('Got quote', rand, quote);

    if (!quote || !quote.sellAmount) {
      const quoteError = (quote as unknown) as QuoteError;
      if (quoteError.error) {
        Logger.log('Quote Error', {
          code: quoteError.error_code,
          msg: quoteError.message,
        });
        return {
          inputAmount: null,
          inputAmountDisplay: null,
          quoteError: quoteError,
          tradeDetails: null,
        };
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
  source: Source,
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
    const network = ethereumUtils.getNetworkFromChainId(chainId);
    const buyTokenAddress = isNativeAsset(outputToken?.address, network)
      ? ETH_ADDRESS_AGGREGATORS
      : outputToken?.address;
    const sellTokenAddress = isNativeAsset(inputToken?.address, network)
      ? ETH_ADDRESS_AGGREGATORS
      : inputToken?.address;

    const sellAmount = convertAmountToRawAmount(
      convertNumberToString(inputAmount),
      inputToken.decimals
    );
    const realSource = getSource(source);
    const quoteParams = {
      buyAmount: null || '0',
      buyTokenAddress,
      chainId: Number(chainId),
      fromAddress,
      sellAmount,
      sellTokenAddress,
      // Add 5% slippage for testing to prevent flaky tests
      slippage: IS_TESTING !== 'true' ? slippage : 5,
      source: realSource,
    };

    const rand = Math.floor(Math.random() * 100);
    Logger.debug('Getting quote ', rand, { quoteParams });
    // @ts-ignore About to get quote
    const quote: Quote = await getQuote(quoteParams);
    Logger.debug('Got quote', rand, quote);

    if (!quote || !quote.buyAmount) {
      const quoteError = (quote as unknown) as QuoteError;
      if (quoteError.error) {
        Logger.log('Quote Error', {
          code: quoteError.error_code,
          msg: quoteError.message,
        });
        return {
          outputAmount: null,
          outputAmountDisplay: null,
          quoteError,
          tradeDetails: null,
        };
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
    const outputAmountDisplay = updatePrecisionToDisplay(
      outputAmount,
      outputPrice
    );

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
  [DisplayValue.native]: null,
};

export default function useSwapDerivedOutputs(chainId: number, type: string) {
  const dispatch = useDispatch();
  const { accountAddress } = useAccountSettings();

  const independentField = useSelector(
    (state: AppState) => state.swap.independentField
  );
  const independentValue = useSelector(
    (state: AppState) => state.swap.independentValue
  );
  const maxInputUpdate = useSelector(
    (state: AppState) => state.swap.maxInputUpdate
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

  const source = useSelector((state: AppState) => state.swap.source);

  const genericAssets = useSelector(
    (state: AppState) => state.data.genericAssets
  );

  const inputPrice = useMemo(() => {
    const price = ethereumUtils.getAssetPrice(
      inputCurrency?.mainnet_address ?? inputCurrency?.address
    );
    return price !== 0 ? price : inputCurrency?.price?.value;
  }, [inputCurrency]);

  const outputPrice =
    genericAssets[outputCurrency?.mainnet_address || outputCurrency?.address]
      ?.price?.value;

  const resetSwapInputs = useCallback(() => {
    derivedValues[SwapModalField.input] = null;
    derivedValues[SwapModalField.output] = null;
    derivedValues[SwapModalField.native] = null;
    displayValues[DisplayValue.input] = null;
    displayValues[DisplayValue.output] = null;
    displayValues[DisplayValue.native] = null;
    dispatch(
      updateSwapQuote({
        derivedValues,
        displayValues,
        quoteError: null,
        tradeDetails: null,
      })
    );
    return {
      quoteError: null,
      result: { derivedValues, displayValues, tradeDetails: null },
    };
  }, [dispatch]);

  const getTradeDetails = useCallback(async () => {
    let tradeDetails = null;

    if (independentValue === '0.') {
      switch (independentField) {
        case SwapModalField.input:
          displayValues[DisplayValue.input] = independentValue;
          displayValues[DisplayValue.output] = null;
          displayValues[DisplayValue.native] = null;
          break;
        case SwapModalField.output:
          displayValues[DisplayValue.input] = null;
          displayValues[DisplayValue.output] = independentValue;
          displayValues[DisplayValue.native] = null;
          break;
        case SwapModalField.native:
          displayValues[DisplayValue.input] = null;
          displayValues[DisplayValue.output] = null;
          displayValues[DisplayValue.native] = independentValue;
          break;
      }

      return {
        quoteError: null,
        result: {
          derivedValues,
          displayValues,
        },
      };
    }

    if (!independentValue) {
      return resetSwapInputs();
    }

    const inputToken = inputCurrency;
    const outputToken = outputCurrency;
    const slippagePercentage = slippageInBips / 100;
    let quoteError: QuoteError | undefined;

    if (independentField === SwapModalField.input) {
      derivedValues[SwapModalField.input] = independentValue;

      displayValues[DisplayValue.input] = independentValue;

      const nativeValue = inputPrice
        ? convertAmountToNativeAmount(independentValue, inputPrice)
        : null;

      derivedValues[SwapModalField.native] = nativeValue;
      displayValues[DisplayValue.native] = nativeValue;

      if (derivedValues[SwapModalField.input] !== independentValue) return;
      const {
        outputAmount,
        outputAmountDisplay,
        tradeDetails: newTradeDetails,
        quoteError: newQuoteError,
      } = await getOutputAmount(
        independentValue,
        inputToken,
        outputToken,
        outputPrice,
        slippagePercentage,
        source,
        accountAddress,
        chainId
      );
      // if original value changed, ignore new quote
      if (derivedValues[SwapModalField.input] !== independentValue) return;

      tradeDetails = newTradeDetails;
      quoteError = newQuoteError;
      derivedValues[SwapModalField.output] = outputAmount;
      // @ts-ignore next-line
      displayValues[DisplayValue.output] = outputAmount
        ? outputAmountDisplay?.toString()
        : null;

      independentValue;
    } else if (independentField === SwapModalField.native) {
      const inputAmount =
        independentValue && inputPrice
          ? convertAmountFromNativeValue(
              independentValue,
              inputPrice,
              inputCurrency.decimals
            )
          : null;

      derivedValues[SwapModalField.native] = independentValue;
      displayValues[DisplayValue.native] = independentValue;
      derivedValues[SwapModalField.input] = inputAmount;

      const inputAmountDisplay = updatePrecisionToDisplay(
        inputAmount,
        inputPrice,
        true
      );
      displayValues[DisplayValue.input] = inputAmountDisplay;

      if (derivedValues[SwapModalField.native] !== independentValue) return;
      const {
        outputAmount,
        outputAmountDisplay,
        tradeDetails: newTradeDetails,
        quoteError: newQuoteError,
      } = await getOutputAmount(
        inputAmount,
        inputToken,
        outputToken,
        outputPrice,
        slippagePercentage,
        source,
        accountAddress,
        chainId
      );
      // if original value changed, ignore new quote
      if (derivedValues[SwapModalField.native] !== independentValue) return;

      tradeDetails = newTradeDetails;
      quoteError = newQuoteError;
      derivedValues[SwapModalField.output] = outputAmount;
      displayValues[DisplayValue.output] =
        outputAmountDisplay?.toString() || null;
    } else {
      if (!outputToken || !inputToken) {
        return {
          quoteError: null,
          result: {
            derivedValues,
            displayValues,
            tradeDetails,
          },
        };
      }
      derivedValues[SwapModalField.output] = independentValue;
      displayValues[DisplayValue.output] = independentValue;

      if (derivedValues[SwapModalField.output] !== independentValue) return;
      const {
        inputAmount,
        inputAmountDisplay,
        tradeDetails: newTradeDetails,
        quoteError: newQuoteError,
      } = await getInputAmount(
        independentValue,
        inputToken,
        outputToken,
        inputPrice.toString(),
        slippagePercentage,
        source,
        accountAddress,
        chainId
      );
      // if original value changed, ignore new quote
      if (derivedValues[SwapModalField.output] !== independentValue) return;
      quoteError = newQuoteError;

      tradeDetails = newTradeDetails;
      derivedValues[SwapModalField.input] = inputAmount || '0';
      // @ts-ignore next-line
      displayValues[DisplayValue.input] = inputAmountDisplay;
      const nativeValue =
        inputPrice && inputAmount
          ? convertAmountToNativeAmount(inputAmount, inputPrice)
          : null;

      derivedValues[SwapModalField.native] = nativeValue;
      displayValues[DisplayValue.native] = nativeValue;
    }

    const data = {
      derivedValues,
      displayValues,
      doneLoadingReserves: true,
      quoteError,
      tradeDetails,
    };

    dispatch(
      updateSwapQuote({
        derivedValues: data.derivedValues,
        displayValues: data.displayValues,
        tradeDetails: data.tradeDetails,
      })
    );
    const slippage = slippageInBips / 100;
    analytics.track(`Updated ${type} details`, {
      aggregator: data.tradeDetails?.source || '',
      inputTokenAddress: inputToken?.address || '',
      inputTokenName: inputToken?.name || '',
      inputTokenSymbol: inputToken?.symbol || '',
      liquiditySources: (data.tradeDetails?.protocols as any[]) || [],
      network: ethereumUtils.getNetworkFromChainId(chainId),
      outputTokenAddress: outputToken?.address || '',
      outputTokenName: outputToken?.name || '',
      outputTokenSymbol: outputToken?.symbol || '',
      slippage: isNaN(slippage) ? 'Error calculating slippage.' : slippage,
      type,
    });

    return { quoteError, result: data };
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
    resetSwapInputs,
    slippageInBips,
    source,
    type,
  ]);
  const { data, isLoading } = useQuery({
    queryFn: getTradeDetails,
    queryKey: [
      'getTradeDetails',
      independentField,
      independentValue,
      derivedValues[SwapModalField.output],
      derivedValues[SwapModalField.input],
      derivedValues[SwapModalField.native],
      inputCurrency,
      outputCurrency,
      inputPrice,
      outputPrice,
      maxInputUpdate,
      slippageInBips,
      source,
    ],
    ...(IS_TESTING !== 'true'
      ? { refetchInterval: SWAP_POLLING_INTERVAL }
      : {}),
  });

  return {
    loading: isLoading && Boolean(independentValue),
    quoteError: data?.quoteError || null,
    resetSwapInputs,
    result: data?.result || {
      derivedValues,
      displayValues,
      tradeDetails: null,
    },
  };
}
