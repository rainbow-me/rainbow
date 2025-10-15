import { useCallback, useMemo } from 'react';
import { DerivedValue, SharedValue, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useForegroundColor } from '@/design-system';
import { convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';
import i18n from '@/languages';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { divWorklet, greaterThanOrEqualToWorklet, mulWorklet, subWorklet } from '@/safe-math/SafeMath';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { highPriceImpactThreshold, severePriceImpactThreshold } from '@/__swaps__/screens/Swap/constants';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { InputValues } from '@/__swaps__/types/swap';
import { getCrossChainTimeEstimateWorklet, getQuoteServiceTimeWorklet } from '@/__swaps__/utils/swaps';

export enum SwapWarningType {
  unknown = 'unknown',
  none = 'none',
  high = 'high',
  severe = 'severe',
  long_wait = 'long_wait',
  no_quote_available = 501,
  insufficient_liquidity = 502,
  fee_on_transfer = 503,
  no_route_found = 504,
}

export interface SwapWarning {
  icon: string;
  type: SwapWarningType;
  title: string;
  subtitle: string;
  color: string;
}

type UsePriceImpactWarningProps = {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  inputNativePrice: DerivedValue<number>;
  inputValues: SharedValue<InputValues>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  outputNativePrice: DerivedValue<number>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  isFetching: SharedValue<boolean>;
  isQuoteStale: SharedValue<number>;
  swapInfo: DerivedValue<{
    areAllInputsZero: boolean;
    areBothAssetsSet: boolean;
    isBridging: boolean;
  }>;
};

const I18N_WARNINGS = {
  subtitles: {
    [SwapWarningType.unknown]: i18n.exchange.price_impact.unknown_price.description(),
    [SwapWarningType.high]: i18n.exchange.price_impact.small_market_try_smaller_amount(),
    [SwapWarningType.long_wait]: i18n.exchange.price_impact.long_wait.description_prefix(),
    [SwapWarningType.severe]: i18n.exchange.price_impact.small_market_try_smaller_amount(),
  },
  titles: {
    [SwapWarningType.unknown]: i18n.exchange.price_impact.unknown_price.title(),
    [SwapWarningType.high]: i18n.exchange.price_impact.you_are_losing_prefix(),
    [SwapWarningType.long_wait]: i18n.exchange.price_impact.long_wait.title(),
    [SwapWarningType.severe]: i18n.exchange.price_impact.you_are_losing_prefix(),
    [SwapWarningType.no_quote_available]: i18n.exchange.quote_errors.no_quote_available(),
    [SwapWarningType.insufficient_liquidity]: i18n.exchange.quote_errors.insufficient_liquidity(),
    [SwapWarningType.fee_on_transfer]: i18n.exchange.quote_errors.fee_on_transfer(),
    [SwapWarningType.no_route_found]: i18n.exchange.quote_errors.no_route_found(),
  },
};

function quoteContainsAsset(
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>,
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>,
  type: 'input' | 'output'
): boolean {
  'worklet';
  const assetKey = type === 'input' ? 'sellTokenAsset' : 'buyTokenAsset';

  const currentAsset = asset.value;
  const currentQuote = quote.value;
  const quoteExists = !!currentQuote && !('error' in currentQuote) && assetKey in currentQuote && !!currentQuote[assetKey]?.chainId;
  if (!quoteExists || !currentAsset) return false;

  const quoteChainId = currentQuote[assetKey]?.chainId;
  const quoteAddress = quoteChainId ? currentQuote[assetKey]?.networks[quoteChainId]?.address : null;
  const doAddressesMatch = quoteAddress === currentAsset.address;
  const isValidQuote = doAddressesMatch && !!quoteChainId && currentAsset.chainId.toString() === quoteChainId?.toString();

  return isValidQuote;
}

function isValidQuote({
  inputAsset,
  outputAsset,
  quote,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
}): boolean {
  'worklet';
  return (
    (quoteContainsAsset(inputAsset, quote, 'input') && quoteContainsAsset(outputAsset, quote, 'output')) ||
    !!(quote.value && 'error' in quote.value)
  );
}

export const useSwapWarning = ({
  inputAsset,
  inputNativePrice,
  inputValues,
  isFetching,
  isQuoteStale,
  outputAsset,
  outputNativePrice,
  quote,
  swapInfo,
}: UsePriceImpactWarningProps) => {
  const currentCurrency = userAssetsStoreManager(state => state.currency);
  const red = useForegroundColor('red');
  const orange = useForegroundColor('orange');
  const label = useForegroundColor('labelTertiary');

  const { colorMap, noWarning } = useMemo(() => {
    const colorMap: Record<string, string> = {
      [SwapWarningType.severe]: red,
      [SwapWarningType.unknown]: red,
      [SwapWarningType.long_wait]: orange,
      [SwapWarningType.none]: label,
      [SwapWarningType.high]: orange,

      // MARK: swap quote errors
      [SwapWarningType.no_quote_available]: label,
      [SwapWarningType.insufficient_liquidity]: label,
      [SwapWarningType.fee_on_transfer]: label,
      [SwapWarningType.no_route_found]: label,
    };

    const noWarning: SwapWarning = { type: SwapWarningType.none, title: '', color: colorMap[SwapWarningType.none], icon: '', subtitle: '' };

    return { colorMap, noWarning };
  }, [label, orange, red]);

  const swapWarning = useSharedValue<SwapWarning>(noWarning);

  const areAllInputsZero = useDerivedValue(
    () =>
      swapInfo.value.areAllInputsZero ||
      (isFetching.value && !(Number(inputValues.value.inputAmount) > 0 || Number(inputValues.value.outputAmount) > 0))
  );

  const getWarning = useCallback(
    (inputNativePrice: number, outputNativePrice: number, quote: Quote | CrosschainQuote | QuoteError | null) => {
      'worklet';
      if (isQuoteStale.value) return noWarning;

      const inputNativeValue = mulWorklet(inputValues.value.inputAmount, inputNativePrice);
      const outputNativeValue = mulWorklet(inputValues.value.outputAmount, outputNativePrice);

      const nativeAmountImpact = subWorklet(inputNativeValue, outputNativeValue);
      const impactInPercentage = Number(inputNativeValue) === 0 ? '0' : divWorklet(nativeAmountImpact, inputNativeValue);

      const priceImpactDisplay = convertAmountToNativeDisplayWorklet(nativeAmountImpact, currentCurrency);
      const isSomeInputGreaterThanZero = Number(inputValues.value.inputAmount) > 0 || Number(inputValues.value.outputAmount) > 0;

      // quote error
      const quoteError = quote as QuoteError;
      if (quoteError.error) {
        const errorType: SwapWarningType = quoteError.error_code || SwapWarningType.no_quote_available;
        const title = I18N_WARNINGS.titles[errorType];
        return { type: errorType, title, color: colorMap[errorType], icon: '􀇿', subtitle: '' };
      }

      // missing asset native price
      if (isSomeInputGreaterThanZero && (!inputNativePrice || !outputNativePrice)) {
        return {
          type: SwapWarningType.unknown,
          icon: '􀇿',
          title: I18N_WARNINGS.titles[SwapWarningType.unknown],
          subtitle: I18N_WARNINGS.subtitles[SwapWarningType.unknown],
          color: colorMap[SwapWarningType.unknown],
        };
      }

      // severe price impact
      if (greaterThanOrEqualToWorklet(impactInPercentage, severePriceImpactThreshold.toString())) {
        return {
          type: SwapWarningType.severe,
          icon: '􀇿',
          title: `${I18N_WARNINGS.titles[SwapWarningType.severe]} ${priceImpactDisplay}`,
          subtitle: I18N_WARNINGS.subtitles[SwapWarningType.severe],
          color: colorMap[SwapWarningType.severe],
        };
      }

      // high price impact
      if (greaterThanOrEqualToWorklet(impactInPercentage, highPriceImpactThreshold.toString())) {
        return {
          type: SwapWarningType.high,
          icon: '􀇿',
          title: `${I18N_WARNINGS.titles[SwapWarningType.high]} ${priceImpactDisplay}`,
          subtitle: I18N_WARNINGS.subtitles[SwapWarningType.high],
          color: colorMap[SwapWarningType.high],
        };
      }

      // long wait
      const serviceTime = getQuoteServiceTimeWorklet({ quote: quote as CrosschainQuote });
      const estimatedTimeOfArrival = serviceTime ? getCrossChainTimeEstimateWorklet({ serviceTime }) : null;
      if (estimatedTimeOfArrival?.isLongWait) {
        return {
          type: SwapWarningType.long_wait,
          icon: '􀇿',
          title: I18N_WARNINGS.titles[SwapWarningType.long_wait],
          subtitle: `${I18N_WARNINGS.subtitles[SwapWarningType.long_wait]} ${estimatedTimeOfArrival.timeEstimateDisplay}`,
          color: colorMap[SwapWarningType.long_wait],
        };
      }

      return noWarning;
    },
    [colorMap, currentCurrency, inputValues, isQuoteStale, noWarning]
  );

  const hasQuotePrices = useDerivedValue(() => {
    const inputPrice = quote.value && 'sellTokenAsset' in quote.value;
    const outputPrice = quote.value && 'buyTokenAsset' in quote.value;
    return !!(inputPrice && outputPrice) || (quote.value && 'error' in quote.value);
  });

  useAnimatedReaction(
    () => {
      if (
        !quote.value ||
        !hasQuotePrices.value ||
        !(inputAsset.value && outputAsset.value) ||
        areAllInputsZero.value ||
        !isValidQuote({ inputAsset, outputAsset, quote })
      ) {
        return noWarning;
      }
      if (isFetching.value) return null;

      return getWarning(inputNativePrice.value, outputNativePrice.value, quote.value);
    },
    warning => {
      if (!warning) return;
      swapWarning.value = warning;
    },
    []
  );

  return { swapWarning };
};
