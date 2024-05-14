import { useCallback, useMemo } from 'react';
import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import * as i18n from '@/languages';
import { useAccountSettings } from '@/hooks';
import { useForegroundColor } from '@/design-system';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';

import { convertAmountToNativeDisplay, divide, greaterThanOrEqualTo, subtract } from '@/__swaps__/utils/numbers';
import { getCrossChainTimeEstimate, getQuoteServiceTime } from '@/__swaps__/utils/swaps';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { highPriceImpactThreshold, severePriceImpactThreshold } from '@/__swaps__/screens/Swap/constants';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';

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

export type NonErrorCodeTypes = 'unknown' | 'high' | 'severe' | 'none' | 'long_wait';

export interface SwapWarning {
  icon: string;
  type: SwapWarningType;
  title: string;
  subtitle: string;
  color: string;
}

export interface SwapTimeEstimate {
  isLongWait: boolean;
  timeEstimate?: number;
  timeEstimateDisplay: string;
}

type UsePriceImpactWarningProps = {
  SwapInputController: ReturnType<typeof useSwapInputsController>;
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  sliderXPosition: SharedValue<number>;
  isFetching: SharedValue<boolean>;
};

type CurrentProps = {
  inputNativeValue: string | number;
  outputNativeValue: string | number;
  quote: Quote | CrosschainQuote | QuoteError | null;
  isFetching: boolean;
  sliderXPosition: number;
};

export const useSwapWarning = ({
  SwapInputController,
  inputAsset,
  outputAsset,
  quote,
  isFetching,
  sliderXPosition,
}: UsePriceImpactWarningProps) => {
  const { nativeCurrency: currentCurrency } = useAccountSettings();
  const red = useForegroundColor('red');
  const orange = useForegroundColor('orange');
  const label = useForegroundColor('labelTertiary');

  const swapWarning = useSharedValue<SwapWarning>({ type: SwapWarningType.none, title: '', color: label, icon: '', subtitle: '' });

  // TODO: Can remove this if not needed elsewhere, but thought it might be useful.
  const timeEstimate = useSharedValue<SwapTimeEstimate | null>(null);

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

  const updateWarning = useCallback(
    (values: SwapWarning) => {
      'worklet';
      swapWarning.modify(prev => ({ ...prev, ...values }));
    },
    [swapWarning]
  );

  const getWarning = useCallback(
    ({ inputNativeValue, outputNativeValue, quote, isFetching }: CurrentProps) => {
      const nativeAmountImpact = subtract(inputNativeValue, outputNativeValue);
      const impactInPercentage = divide(nativeAmountImpact, inputNativeValue);
      const priceImpactDisplay = convertAmountToNativeDisplay(nativeAmountImpact, currentCurrency);

      if (!isFetching && (quote as QuoteError)?.error) {
        const quoteError = quote as QuoteError;
        const errorType = (quoteError.error_code || SwapWarningType.no_quote_available).toString();
        const title = i18n.t((i18n.l.exchange.quote_errors as Record<string, string>)[errorType]);
        runOnUI(updateWarning)({ type: errorType as SwapWarningType, title, color: colorMap[errorType], icon: '􀇿', subtitle: '' });
      } else if (!isFetching && !!quote && !(quote as QuoteError)?.error && (!inputNativeValue || !outputNativeValue)) {
        runOnUI(updateWarning)({
          type: SwapWarningType.unknown,
          icon: '􀇿',
          title: i18n.t(i18n.l.exchange.price_impact.unknown_price.title),
          subtitle: i18n.t(i18n.l.exchange.price_impact.unknown_price.description),
          color: colorMap[SwapWarningType.unknown],
        });
      } else if (!isFetching && !!quote && greaterThanOrEqualTo(impactInPercentage, severePriceImpactThreshold)) {
        runOnUI(updateWarning)({
          type: SwapWarningType.severe,
          icon: '􀇿',
          title: i18n.t(i18n.l.exchange.price_impact.you_are_losing, {
            priceImpact: priceImpactDisplay,
          }),
          subtitle: i18n.t(i18n.l.exchange.price_impact.small_market_try_smaller_amount),
          color: colorMap[SwapWarningType.severe],
        });
      } else if (!isFetching && !!quote && greaterThanOrEqualTo(impactInPercentage, highPriceImpactThreshold)) {
        runOnUI(updateWarning)({
          type: SwapWarningType.high,
          icon: '􀇿',
          title: i18n.t(i18n.l.exchange.price_impact.you_are_losing, {
            priceImpact: priceImpactDisplay,
          }),
          subtitle: i18n.t(i18n.l.exchange.price_impact.small_market_try_smaller_amount),
          color: colorMap[SwapWarningType.high],
        });
      } else if (!!quote && !(quote as QuoteError)?.error) {
        const serviceTime = getQuoteServiceTime({ quote: quote as CrosschainQuote });
        const estimatedTimeOfArrival = serviceTime ? getCrossChainTimeEstimate({ serviceTime }) : null;

        if (estimatedTimeOfArrival?.isLongWait) {
          runOnUI(updateWarning)({
            type: SwapWarningType.long_wait,
            icon: '􀇿',
            title: i18n.t(i18n.l.exchange.price_impact.long_wait.title),
            subtitle: i18n.t(i18n.l.exchange.price_impact.long_wait.description, {
              time: estimatedTimeOfArrival.timeEstimateDisplay,
            }),
            color: colorMap[SwapWarningType.long_wait],
          });
        } else {
          runOnUI(updateWarning)({ type: SwapWarningType.none, title: '', color: colorMap[SwapWarningType.none], icon: '', subtitle: '' });
        }
      } else {
        runOnUI(updateWarning)({ type: SwapWarningType.none, title: '', color: colorMap[SwapWarningType.none], icon: '', subtitle: '' });
      }
    },
    [colorMap, currentCurrency, updateWarning]
  );

  // TODO: How can we make this more efficient?
  useAnimatedReaction(
    () => ({
      inputNativeValue: SwapInputController.inputValues.value.inputNativeValue,
      outputNativeValue: SwapInputController.inputValues.value.outputNativeValue,
      quote: quote.value,
      isFetching: isFetching.value,
      sliderXPosition: sliderXPosition.value,
    }),
    (current, previous) => {
      if (!inputAsset || !outputAsset) {
        return;
      }

      if (previous?.sliderXPosition && previous?.sliderXPosition !== current.sliderXPosition) {
        swapWarning.modify(prev => ({ ...prev, display: '', type: SwapWarningType.none }));
      } else if (
        (current.quote && previous?.quote !== current.quote) ||
        previous?.inputNativeValue !== current.inputNativeValue ||
        previous?.outputNativeValue !== current.outputNativeValue
      ) {
        runOnJS(getWarning)(current);
      }
    }
  );

  return { swapWarning, timeEstimate };
};
