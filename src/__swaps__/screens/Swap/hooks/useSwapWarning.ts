import { useMemo } from 'react';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import * as i18n from '@/languages';
import { useAccountSettings } from '@/hooks';
import { useForegroundColor } from '@/design-system';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { getCrossChainTimeEstimateWorklet, getQuoteServiceTimeWorklet } from '@/__swaps__/utils/swaps';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { highPriceImpactThreshold, severePriceImpactThreshold } from '@/__swaps__/screens/Swap/constants';
import { divWorklet, greaterThanOrEqualToWorklet, subWorklet } from '@/safe-math/SafeMath';
import { inputValuesType } from '@/__swaps__/types/swap';
import { convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';

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
  inputValues: SharedValue<inputValuesType>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  isFetching: SharedValue<boolean>;
  isQuoteStale: SharedValue<number>;
};

const I18N_WARNINGS = {
  subtitles: {
    [SwapWarningType.unknown]: i18n.t(i18n.l.exchange.price_impact.unknown_price.description),
    [SwapWarningType.high]: i18n.t(i18n.l.exchange.price_impact.small_market_try_smaller_amount),
    [SwapWarningType.long_wait]: i18n.t(i18n.l.exchange.price_impact.long_wait.description_prefix),
    [SwapWarningType.severe]: i18n.t(i18n.l.exchange.price_impact.small_market_try_smaller_amount),
  },
  titles: {
    [SwapWarningType.unknown]: i18n.t(i18n.l.exchange.price_impact.unknown_price.title),
    [SwapWarningType.high]: i18n.t(i18n.l.exchange.price_impact.you_are_losing_prefix),
    [SwapWarningType.long_wait]: i18n.t(i18n.l.exchange.price_impact.long_wait.title),
    [SwapWarningType.severe]: i18n.t(i18n.l.exchange.price_impact.you_are_losing_prefix),
    [SwapWarningType.no_quote_available]: i18n.t(i18n.l.exchange.quote_errors.no_quote_available),
    [SwapWarningType.insufficient_liquidity]: i18n.t(i18n.l.exchange.quote_errors.insufficient_liquidity),
    [SwapWarningType.fee_on_transfer]: i18n.t(i18n.l.exchange.quote_errors.fee_on_transfer),
    [SwapWarningType.no_route_found]: i18n.t(i18n.l.exchange.quote_errors.no_route_found),
  },
};

export const useSwapWarning = ({ inputAsset, outputAsset, inputValues, quote, isFetching, isQuoteStale }: UsePriceImpactWarningProps) => {
  const { nativeCurrency: currentCurrency } = useAccountSettings();
  const red = useForegroundColor('red');
  const orange = useForegroundColor('orange');
  const label = useForegroundColor('labelTertiary');

  const colorMap: Record<string, string> = useMemo(
    () => ({
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
    }),
    [label, orange, red]
  );

  const NO_WARNING = { type: SwapWarningType.none, title: '', color: colorMap[SwapWarningType.none], icon: '', subtitle: '' };

  const swapWarning = useDerivedValue<SwapWarning>(() => {
    const doInputAndOutputAssetsExist = inputAsset.value && outputAsset.value;
    if (!doInputAndOutputAssetsExist) return NO_WARNING;

    if (isQuoteStale.value || isFetching.value || !quote.value) return NO_WARNING;

    const inputNativeValue = inputValues.value.inputNativeValue;
    const outputNativeValue = inputValues.value.outputNativeValue;
    const inputNativePrice = inputAsset.value?.nativePrice;
    const outputNativePrice = outputAsset.value?.nativePrice;

    const nativeAmountImpact = subWorklet(inputNativeValue, outputNativeValue);
    const impactInPercentage = Number(inputNativeValue) === 0 ? '0' : divWorklet(nativeAmountImpact, inputNativeValue);

    const priceImpactDisplay = convertAmountToNativeDisplayWorklet(nativeAmountImpact, currentCurrency);
    const isSomeInputGreaterThanZero = Number(inputValues.value.inputAmount) > 0 || Number(inputValues.value.outputAmount) > 0;

    // quote error
    const quoteError = quote.value as QuoteError;
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
    const serviceTime = getQuoteServiceTimeWorklet({ quote: quote.value as CrosschainQuote });
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

    return NO_WARNING;
  });

  return { swapWarning };
};
