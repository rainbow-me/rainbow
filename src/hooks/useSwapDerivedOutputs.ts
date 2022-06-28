import {
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS,
  getQuote,
  Quote,
  QuoteError,
} from '@rainbow-me/swaps';
import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NativeModules } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IS_APK_BUILD, IS_TESTING } from 'react-native-dotenv';
import { useDispatch, useSelector } from 'react-redux';
import { Token } from '../entities/tokens';
import useAccountSettings from './useAccountSettings';
import { EthereumAddress } from '@rainbow-me/entities';
import { isNativeAsset } from '@rainbow-me/handlers/assets';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import { AppState } from '@rainbow-me/redux/store';
import {
  Source,
  SwapModalField,
  updateSwapQuote,
} from '@rainbow-me/redux/swap';
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
  native = 'nativeAmountDisplay',
}

const DEBOUNCE_MS = 500;

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
      // Add 5% slippage for testing to prevent flaky tests
      slippage: IS_TESTING !== 'true' ? slippage : 5,
      source: source,
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
        if (
          // insufficient liquidity
          quoteError.error_code === 502 ||
          // Unsupported Token
          quoteError.error_code === 501
        ) {
          return {
            inputAmount: null,
            inputAmountDisplay: null,
            noLiquidity: true,
            tradeDetails: null,
          };
        }
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

    const quoteParams = {
      buyAmount: null || '0',
      buyTokenAddress,
      chainId: Number(chainId),
      fromAddress,
      sellAmount,
      sellTokenAddress,
      // Add 5% slippage for testing to prevent flaky tests
      slippage: IS_TESTING !== 'true' ? slippage : 5,
      source,
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
        if (
          // insufficient liquidity
          quoteError.error_code === 502 ||
          // Unsupported Token
          quoteError.error_code === 501
        ) {
          return {
            noLiquidity: true,
            outputAmount: null,
            outputAmountDisplay: null,
            tradeDetails: null,
          };
        }
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
  const [loading, setLoading] = useState(false);
  const [insufficientLiquidity, setInsufficientLiquidity] = useState(false);

  const isDeposit = type === ExchangeModalTypes.deposit;
  const isWithdrawal = type === ExchangeModalTypes.withdrawal;
  const isSavings = isDeposit || isWithdrawal;

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

  const derivedValuesFromRedux = useSelector(
    (state: AppState) => state.swap.derivedValues
  );
  const genericAssets = useSelector(
    (state: AppState) => state.data.genericAssets
  );

  const inputPrice = ethereumUtils.getAssetPrice(
    inputCurrency?.mainnet_address || inputCurrency?.address
  );
  const outputPrice =
    genericAssets[outputCurrency?.mainnet_address || outputCurrency?.address]
      ?.price?.value;

  const { accountAddress } = useAccountSettings();

  const resetSwapInputs = () => {
    derivedValues[SwapModalField.input] = null;
    derivedValues[SwapModalField.output] = null;
    derivedValues[SwapModalField.native] = null;
    displayValues[DisplayValue.input] = null;
    displayValues[DisplayValue.output] = null;
    displayValues[DisplayValue.native] = null;
    setResult({ derivedValues, displayValues, tradeDetails: null });
    setLoading(false);
    setInsufficientLiquidity(false);
  };

  const getTradeDetails = useMemo(
    () =>
      debounce(async (independentValue, derivedValuesFromRedux) => {
        let tradeDetails = null;

        if (independentValue === '0.') {
          switch (independentField) {
            case SwapModalField.input:
              displayValues[DisplayValue.input] = independentValue;
              break;
            case SwapModalField.output:
              displayValues[DisplayValue.output] = independentValue;
              break;
            case SwapModalField.native:
              displayValues[DisplayValue.native] = independentValue;
              break;
          }
          setResult({
            derivedValues,
            displayValues,
            tradeDetails,
          });
          return;
        }

        if (
          (isZero(independentValue) && independentValue.length === 1) ||
          !independentValue
        ) {
          resetSwapInputs();
          return;
        }

        if ((!inputCurrency || !outputCurrency) && !isSavings) {
          setInsufficientLiquidity(false);
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
          displayValues[DisplayValue.input] = maxInputUpdate
            ? updatePrecisionToDisplay(independentValue, null, true)
            : independentValue;

          const nativeValue = inputPrice
            ? convertAmountToNativeAmount(independentValue, inputPrice)
            : null;

          derivedValues[SwapModalField.native] = nativeValue;
          displayValues[DisplayValue.native] = nativeValue;

          const {
            outputAmount,
            outputAmountDisplay,
            tradeDetails: newTradeDetails,
            noLiquidity,
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
          setInsufficientLiquidity(!!noLiquidity);
          tradeDetails = newTradeDetails;
          derivedValues[SwapModalField.output] = outputAmount;
          displayValues[DisplayValue.output] =
            outputAmountDisplay?.toString() || null;
        } else if (independentField === SwapModalField.native) {
          const inputAmount =
            independentValue && inputPrice
              ? convertAmountFromNativeValue(
                  independentValue,
                  inputPrice,
                  inputCurrency.decimals
                )
              : null;

          // The quote is the same
          if (
            derivedValuesFromRedux &&
            independentValue === derivedValuesFromRedux[SwapModalField.native]
          ) {
            setLoading(false);
            return;
          }

          derivedValues[SwapModalField.native] = independentValue;
          displayValues[DisplayValue.native] = independentValue;
          derivedValues[SwapModalField.input] = inputAmount;

          const inputAmountDisplay = updatePrecisionToDisplay(
            inputAmount,
            inputPrice,
            true
          );
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
            source,
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
            setInsufficientLiquidity(false);
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
            noLiquidity,
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

          setInsufficientLiquidity(!!noLiquidity);

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
      }, DEBOUNCE_MS),
    [
      accountAddress,
      chainId,
      dispatch,
      isSavings,
      maxInputUpdate,
      inputPrice,
      outputPrice,
      slippageInBips,
      source,
      inputCurrency,
      outputCurrency,
      independentField,
    ]
  );

  useEffect(() => {
    getTradeDetails(independentValue, derivedValuesFromRedux);
  }, [getTradeDetails, independentValue, derivedValuesFromRedux]);

  return {
    insufficientLiquidity,
    loading,
    resetSwapInputs,
    result,
  };
}
