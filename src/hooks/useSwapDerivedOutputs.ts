import {
  CrosschainQuote,
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS,
  getCrosschainQuote,
  getQuote,
  Quote,
  QuoteError,
  QuoteParams,
  Source,
  SwapType,
} from '@rainbow-me/swaps';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
// DO NOT REMOVE THESE COMMENTED ENV VARS
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IS_APK_BUILD, IS_TESTING } from 'react-native-dotenv';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import isTestFlight from '@/helpers/isTestFlight';
import { useDispatch, useSelector } from 'react-redux';
import { SwappableAsset } from '../entities/tokens';
import useAccountSettings from './useAccountSettings';
import { analytics } from '@/analytics';
import { EthereumAddress } from '@/entities';
import { isNativeAsset } from '@/handlers/assets';
import { AppState } from '@/redux/store';
import { SwapModalField, updateSwapQuote } from '@/redux/swap';
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
import { logger, RainbowError } from '@/logger';

const SWAP_POLLING_INTERVAL = 5000;

enum DisplayValue {
  input = 'inputAmountDisplay',
  output = 'outputAmountDisplay',
  native = 'nativeAmountDisplay',
}

const getSource = (source: Source) => {
  if (source === Source.Aggregator0x || source === Source.Aggregotor1inch) return source;
  return null;
};

const getInputAmount = async (
  outputAmount: string | null,
  inputToken: SwappableAsset | null,
  outputToken: SwappableAsset,
  inputPrice: string | null,
  slippage: number,
  source: Source,
  fromAddress: EthereumAddress
): Promise<{
  inputAmount: string | null;
  inputAmountDisplay: string | null;
  quoteError?: QuoteError;
  tradeDetails: Quote | CrosschainQuote | null;
} | null> => {
  if (!inputToken || !outputAmount || isZero(outputAmount) || !outputToken) return null;

  try {
    const outputChainId = ethereumUtils.getChainIdFromNetwork(outputToken?.network);
    const outputNetwork = ethereumUtils.getNetworkFromChainId(outputChainId);

    const inputChainId = ethereumUtils.getChainIdFromNetwork(inputToken?.network);
    const inputNetwork = ethereumUtils.getNetworkFromChainId(inputChainId);

    const inputTokenAddress = isNativeAsset(inputToken?.address, inputNetwork) ? ETH_ADDRESS_AGGREGATORS : inputToken?.address;

    const outputTokenAddress = isNativeAsset(outputToken?.address, outputNetwork) ? ETH_ADDRESS_AGGREGATORS : outputToken?.address;

    const isCrosschainSwap = inputNetwork !== outputNetwork;
    if (isCrosschainSwap) return null;

    const buyAmount = convertAmountToRawAmount(convertNumberToString(outputAmount), outputToken.decimals);

    logger.info(`[getInputAmount]: `, {
      outputToken,
      outputChainId,
      outputNetwork,
      outputTokenAddress,
      inputToken,
      inputChainId,
      inputNetwork,
      inputTokenAddress,
      isCrosschainSwap,
    });

    const quoteSource = getSource(source);
    const quoteParams: QuoteParams = {
      buyAmount,
      buyTokenAddress: outputTokenAddress,
      chainId: Number(inputChainId),
      fromAddress,
      sellTokenAddress: inputTokenAddress,
      // Add 5% slippage for testing to prevent flaky tests
      slippage: IS_TESTING !== 'true' ? slippage : 5,
      ...(quoteSource ? { source } : {}),
      swapType: SwapType.normal,
    };

    const rand = Math.floor(Math.random() * 100);
    logger.debug('[getInputAmount]: Getting quote', { rand, quoteParams });
    // Do not deleeeet the comment below 😤
    // @ts-ignore About to get quote

    const quote = await getQuote(quoteParams);

    // if no quote, if quote is error or there's no sell amount
    if (!quote || (quote as QuoteError).error || !(quote as Quote).sellAmount) {
      if ((quote as QuoteError).error) {
        const quoteError = quote as unknown as QuoteError;
        logger.error(new RainbowError('[getInputAmount]: Quote error'), {
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
      return null;
    }
    const quoteTradeDetails = quote as Quote;
    const inputAmount = convertRawAmountToDecimalFormat(quoteTradeDetails.sellAmount.toString(), inputToken.decimals);

    const inputAmountDisplay = inputAmount && inputPrice ? updatePrecisionToDisplay(inputAmount, inputPrice) : null;

    return {
      inputAmount,
      inputAmountDisplay,
      tradeDetails: {
        ...quoteTradeDetails,
        inputTokenDecimals: inputToken.decimals,
        outputTokenDecimals: outputToken.decimals,
      },
    };
  } catch (e) {
    return null;
  }
};

const getOutputAmount = async (
  inputAmount: string | null,
  inputToken: SwappableAsset,
  outputToken: SwappableAsset | null,
  slippage: number,
  source: Source,
  fromAddress: EthereumAddress,
  refuel: boolean
): Promise<{
  outputAmount: string | null;
  outputAmountDisplay: string | null;
  tradeDetails: Quote | CrosschainQuote | null;
  quoteError?: QuoteError;
} | null> => {
  if (!inputAmount || isZero(inputAmount) || !outputToken) return null;

  try {
    const outputChainId = ethereumUtils.getChainIdFromNetwork(outputToken.network);
    const outputNetwork = outputToken.network;
    const buyTokenAddress = isNativeAsset(outputToken?.address, outputNetwork) ? ETH_ADDRESS_AGGREGATORS : outputToken?.address;
    const inputChainId = ethereumUtils.getChainIdFromNetwork(inputToken.network);
    const inputNetwork = inputToken.network;

    const sellTokenAddress = isNativeAsset(inputToken?.address, inputNetwork) ? ETH_ADDRESS_AGGREGATORS : inputToken?.address;

    const sellAmount = convertAmountToRawAmount(convertNumberToString(inputAmount), inputToken.decimals);
    const isCrosschainSwap = outputNetwork !== inputNetwork;

    // logger.info(`[getOutputAmount]: `, {
    //   outputToken,
    //   outputChainId,
    //   outputNetwork,
    //   inputToken,
    //   inputChainId,
    //   inputNetwork,
    //   isCrosschainSwap,
    // });

    const quoteSource = getSource(source);
    const quoteParams: QuoteParams = {
      buyTokenAddress,
      chainId: Number(inputChainId),
      fromAddress,
      sellAmount,
      sellTokenAddress,
      // Add 5% slippage for testing to prevent flaky tests
      slippage: IS_TESTING !== 'true' ? slippage : 5,
      ...(quoteSource ? { source } : {}),
      swapType: isCrosschainSwap ? SwapType.crossChain : SwapType.normal,
      toChainId: Number(outputChainId),
      refuel,
    };

    const rand = Math.floor(Math.random() * 100);
    logger.debug('[getOutputAmount]: Getting quote', { rand, quoteParams });
    // Do not deleeeet the comment below 😤
    // @ts-ignore About to get quote
    const quote: Quote | CrosschainQuote | QuoteError | null = await (isCrosschainSwap ? getCrosschainQuote : getQuote)(quoteParams);
    logger.debug('[getOutputAmount]: Got quote', { rand, quote });

    if (!quote || (quote as QuoteError)?.error || !(quote as Quote)?.buyAmount) {
      const quoteError = quote as QuoteError;
      if (quoteError.error) {
        logger.error(new RainbowError('[getOutputAmount]: Quote error'), {
          code: quoteError.error_code,
          msg: quoteError.message,
        });
        return {
          quoteError,
          outputAmount: null,
          outputAmountDisplay: null,
          tradeDetails: null,
        };
      }
      return null;
    }

    const tradeDetails = quote as Quote | CrosschainQuote;
    const outputAmount = convertRawAmountToDecimalFormat(tradeDetails.buyAmount.toString(), outputToken.decimals);

    const outputAmountDisplay = updatePrecisionToDisplay(outputAmount);

    return {
      outputAmount,
      outputAmountDisplay,
      tradeDetails: {
        ...tradeDetails,
        inputTokenDecimals: inputToken.decimals,
        outputTokenDecimals: outputToken.decimals,
      },
    };
  } catch (e) {
    return null;
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

export default function useSwapDerivedOutputs(type: string) {
  const dispatch = useDispatch();
  const { accountAddress } = useAccountSettings();

  const independentField = useSelector((state: AppState) => state.swap.independentField);
  const independentValue = useSelector((state: AppState) => state.swap.independentValue);
  const maxInputUpdate = useSelector((state: AppState) => state.swap.maxInputUpdate);
  const inputCurrency = useSelector((state: AppState) => state.swap.inputCurrency);
  const outputCurrency = useSelector((state: AppState) => state.swap.outputCurrency);
  const slippageInBips = useSelector((state: AppState) => state.swap.slippageInBips);

  const source = useSelector((state: AppState) => state.swap.source);

  const [refuel, setRefuel] = useState(false);

  const inputPrice = useMemo(() => {
    const price = ethereumUtils.getAssetPrice(inputCurrency?.mainnet_address ?? inputCurrency?.address);
    return price !== 0 ? price : inputCurrency?.price?.value;
  }, [inputCurrency]);

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
    if (!independentValue) {
      return resetSwapInputs();
    }

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
          tradeDetails: null,
        },
      };
    }

    logger.debug('[getTradeDetails]: Getting trade details', {
      independentField,
      independentValue,
      inputCurrency,
      outputCurrency,
      inputPrice,
      slippageInBips,
      source,
      refuel,
    });

    let tradeDetails = null;
    const slippagePercentage = slippageInBips / 100;
    let quoteError: QuoteError | undefined;

    if (independentField === SwapModalField.input) {
      const nativeValue = inputPrice ? convertAmountToNativeAmount(independentValue, inputPrice) : null;
      derivedValues[SwapModalField.input] = independentValue;
      displayValues[DisplayValue.input] = independentValue;
      derivedValues[SwapModalField.native] = nativeValue;
      displayValues[DisplayValue.native] = nativeValue;

      if (derivedValues[SwapModalField.input] !== independentValue) return;

      const outputAmountData = await getOutputAmount(
        independentValue,
        inputCurrency,
        outputCurrency,
        slippagePercentage,
        source,
        accountAddress,
        refuel
      );

      // if original value changed, ignore new quote
      if (derivedValues[SwapModalField.input] !== independentValue || !outputAmountData) return null;

      const { outputAmount, outputAmountDisplay, tradeDetails: newTradeDetails, quoteError: newQuoteError } = outputAmountData;

      tradeDetails = newTradeDetails;
      quoteError = newQuoteError;
      derivedValues[SwapModalField.output] = outputAmount;
      displayValues[DisplayValue.output] = outputAmountDisplay;
    } else if (independentField === SwapModalField.native) {
      const inputAmount =
        independentValue && inputPrice ? convertAmountFromNativeValue(independentValue, inputPrice, inputCurrency.decimals) : null;

      const inputAmountDisplay = updatePrecisionToDisplay(inputAmount, inputPrice, true);
      derivedValues[SwapModalField.native] = independentValue;
      displayValues[DisplayValue.native] = independentValue;
      derivedValues[SwapModalField.input] = inputAmount;
      displayValues[DisplayValue.input] = inputAmountDisplay;

      if (derivedValues[SwapModalField.native] !== independentValue) return;

      const outputAmountData = await getOutputAmount(
        inputAmount,
        inputCurrency,
        outputCurrency,
        slippagePercentage,
        source,
        accountAddress,
        refuel
      );
      // if original value changed, ignore new quote
      if (derivedValues[SwapModalField.native] !== independentValue || !outputAmountData) return null;

      const { outputAmount, outputAmountDisplay, tradeDetails: newTradeDetails, quoteError: newQuoteError } = outputAmountData;

      tradeDetails = newTradeDetails;
      quoteError = newQuoteError;
      derivedValues[SwapModalField.output] = outputAmount;
      displayValues[DisplayValue.output] = outputAmountDisplay;
    } else {
      if (!outputCurrency || !inputCurrency) {
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

      const inputAmountData = await getInputAmount(
        independentValue,
        inputCurrency,
        outputCurrency,
        inputPrice,
        slippagePercentage,
        source,
        accountAddress
      );

      // if original value changed, ignore new quote
      if (derivedValues[SwapModalField.output] !== independentValue || !inputAmountData) return null;

      const { inputAmount, inputAmountDisplay, tradeDetails: newTradeDetails, quoteError: newQuoteError } = inputAmountData;

      const nativeValue = inputPrice && inputAmount ? convertAmountToNativeAmount(inputAmount, inputPrice) : null;

      quoteError = newQuoteError;
      tradeDetails = newTradeDetails;
      derivedValues[SwapModalField.input] = inputAmount;
      displayValues[DisplayValue.input] = inputAmountDisplay;
      derivedValues[SwapModalField.native] = nativeValue;
      displayValues[DisplayValue.native] = nativeValue;
    }

    const data = {
      derivedValues,
      displayValues,
      quoteError,
      tradeDetails,
    };

    logger.debug('[getTradeDetails]: Got trade details', {
      data,
    });

    dispatch(
      updateSwapQuote({
        derivedValues: data.derivedValues,
        displayValues: data.displayValues,
        tradeDetails: data.tradeDetails,
      })
    );
    analytics.track(`Updated ${type} details`, {
      aggregator: data.tradeDetails?.source || '',
      inputTokenAddress: inputCurrency?.address || '',
      inputTokenName: inputCurrency?.name || '',
      inputTokenSymbol: inputCurrency?.symbol || '',
      liquiditySources: (data.tradeDetails?.protocols as any[]) || [],
      network: ethereumUtils.getNetworkFromChainId(inputCurrency.chainId),
      outputTokenAddress: outputCurrency?.address || '',
      outputTokenName: outputCurrency?.name || '',
      outputTokenSymbol: outputCurrency?.symbol || '',
      slippage: isNaN(slippagePercentage) ? 'Error calculating slippage.' : slippagePercentage,
      type,
    });

    return { quoteError, result: data };
  }, [
    accountAddress,
    dispatch,
    independentField,
    independentValue,
    inputCurrency,
    inputPrice,
    outputCurrency,
    resetSwapInputs,
    slippageInBips,
    source,
    type,
    refuel,
  ]);
  const { data, isLoading } = useQuery({
    queryFn: getTradeDetails,
    queryKey: [
      'getTradeDetails',
      independentField,
      independentValue,
      inputCurrency,
      outputCurrency,
      inputPrice,
      maxInputUpdate,
      slippageInBips,
      source,
      refuel,
    ],
    ...(IS_TESTING !== 'true' ? { refetchInterval: SWAP_POLLING_INTERVAL } : {}),
  });

  return {
    loading: isLoading && Boolean(independentValue),
    quoteError: data?.quoteError || null,
    resetSwapInputs,
    setRefuel,
    result: data?.result || {
      derivedValues,
      displayValues,
      tradeDetails: null,
    },
  };
}
