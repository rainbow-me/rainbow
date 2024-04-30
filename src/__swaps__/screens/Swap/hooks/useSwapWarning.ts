import { useCallback } from 'react';
import * as i18n from '@/languages';
import { useAccountSettings } from '@/hooks';
import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { convertAmountToNativeDisplay, divide, greaterThanOrEqualTo, subtract } from '@/__swaps__/utils/numbers';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';
import { BigNumberish } from '@/__swaps__/utils/hex';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { getCrossChainTimeEstimate, getQuoteServiceTime } from '@/__swaps__/utils/swaps';
import { useSwapQuoteStore } from '@/state/swaps/quote';

const highPriceImpactThreshold = 0.05;
const severePriceImpactThreshold = 0.1;

export enum SwapWarningType {
  unknown = 'unknown',
  none = 'none',
  high = 'high',
  severe = 'severe',
  long_wait = 'long_wait',

  // quote errors
  no_quote_available = 501,
  insufficient_liquidity = 502,
  fee_on_transfer = 503,
  no_route_found = 504,
}

export interface SwapWarning {
  type: SwapWarningType;
  display: string;
}

export interface SwapTimeEstimate {
  isLongWait: boolean;
  timeEstimate?: number;
  timeEstimateDisplay: string;
}

type UsePriceImpactWarningProps = {
  SwapInputController: ReturnType<typeof useSwapInputsController>;
  sliderXPosition: SharedValue<number>;
  isFetching: SharedValue<boolean>;
};

export const useSwapWarning = ({ SwapInputController, isFetching, sliderXPosition }: UsePriceImpactWarningProps) => {
  const { nativeCurrency: currentCurrency } = useAccountSettings();

  const quote = useSwapQuoteStore(state => state.quote);

  const timeEstimate = useSharedValue<SwapTimeEstimate | null>(null);

  const swapWarning = useSharedValue<SwapWarning>({
    type: SwapWarningType.none,
    display: '',
  });

  const getWarning = useCallback(
    ({
      inputNativeValue,
      outputNativeValue,
      quote,
      isFetching,
    }: {
      inputNativeValue: BigNumberish;
      outputNativeValue: BigNumberish;
      quote: Quote | CrosschainQuote | QuoteError | null;
      isFetching: boolean;
    }) => {
      const updateWarning = (values: SwapWarning) => {
        'worklet';
        swapWarning.modify(prev => ({
          ...prev,
          ...values,
        }));
      };

      const nativeAmountImpact = subtract(inputNativeValue, outputNativeValue);
      const impact = divide(nativeAmountImpact, inputNativeValue);
      const display = convertAmountToNativeDisplay(nativeAmountImpact, currentCurrency);

      /**
       * ORDER IS IMPORTANT HERE
       *
       * We want to show quote errors first if they exist, then
       * we want to show severe/high price impact warnings if they exists
       * if those are not present, we want to show the long wait warning
       * if there is no warnings at all, we want to show none
       */
      if (!isFetching && (quote as QuoteError)?.error) {
        const quoteError = quote as QuoteError;

        switch (quoteError.error_code) {
          default:
          case SwapWarningType.no_quote_available: {
            runOnUI(updateWarning)({
              type: SwapWarningType.no_quote_available,
              display: i18n.t(i18n.l.exchange.quote_errors.no_quote_available),
            });
            break;
          }
          case SwapWarningType.insufficient_liquidity: {
            runOnUI(updateWarning)({
              type: SwapWarningType.insufficient_liquidity,
              display: i18n.t(i18n.l.exchange.quote_errors.insufficient_liquidity),
            });
            break;
          }
          case SwapWarningType.fee_on_transfer: {
            runOnUI(updateWarning)({
              type: SwapWarningType.fee_on_transfer,
              display: i18n.t(i18n.l.exchange.quote_errors.fee_on_transfer),
            });
            break;
          }
          case SwapWarningType.no_route_found: {
            runOnUI(updateWarning)({
              type: SwapWarningType.no_route_found,
              display: i18n.t(i18n.l.exchange.quote_errors.no_route_found),
            });
            break;
          }
        }
      } else if (!isFetching && !!quote && !(quote as QuoteError)?.error && (!inputNativeValue || !outputNativeValue)) {
        runOnUI(updateWarning)({
          type: SwapWarningType.unknown,
          display: i18n.t(i18n.l.exchange.price_impact.unknown_price.title),
        });
      } else if (!isFetching && !!quote && greaterThanOrEqualTo(impact, severePriceImpactThreshold)) {
        runOnUI(updateWarning)({
          type: SwapWarningType.severe,
          display,
        });
      } else if (!isFetching && !!quote && greaterThanOrEqualTo(impact, highPriceImpactThreshold)) {
        runOnUI(updateWarning)({
          type: SwapWarningType.high,
          display,
        });
      } else if (!!quote && !(quote as QuoteError)?.error) {
        const serviceTime = getQuoteServiceTime({
          quote: quote as CrosschainQuote,
        });

        const estimatedTimeOfArrival = serviceTime
          ? getCrossChainTimeEstimate({
              serviceTime,
            })
          : null;
        timeEstimate.value = estimatedTimeOfArrival;
        if (estimatedTimeOfArrival?.isLongWait) {
          runOnUI(updateWarning)({
            type: SwapWarningType.long_wait,
            display: estimatedTimeOfArrival.timeEstimateDisplay,
          });
          return;
        } else {
          runOnUI(updateWarning)({
            type: SwapWarningType.none,
            display,
          });
        }
      } else {
        runOnUI(updateWarning)({
          type: SwapWarningType.none,
          display,
        });
      }
    },
    [currentCurrency, swapWarning, timeEstimate]
  );

  useAnimatedReaction(
    () => ({
      inputNativeValue: SwapInputController.inputValues.value.inputNativeValue,
      outputNativeValue: SwapInputController.inputValues.value.outputNativeValue,
      quote,
      isFetching: isFetching.value,
      sliderXPosition: sliderXPosition.value,
    }),
    (current, previous) => {
      // NOTE: While fetching, we don't want to display a warning
      if (current?.isFetching) {
        swapWarning.value = { display: '', type: SwapWarningType.none };
        return;
      }

      // NOTE: While the user is scrubbing the slider, we don't want to show the price impact warning.
      if (previous?.sliderXPosition && previous?.sliderXPosition !== current.sliderXPosition) {
        swapWarning.value = { display: '', type: SwapWarningType.none };
        return;
      }

      // NOTE: If we previous had a quote and the current quote is null we want to reset the state here
      if (!current.quote && previous?.quote) {
        swapWarning.value = { display: '', type: SwapWarningType.none };
        return;
      }

      if (
        (current.quote && previous?.quote !== current.quote) ||
        previous?.inputNativeValue !== current.inputNativeValue ||
        previous?.outputNativeValue !== current.outputNativeValue
      ) {
        runOnJS(getWarning)({
          inputNativeValue: current.inputNativeValue,
          outputNativeValue: current.outputNativeValue,
          quote: current.quote,
          isFetching: current.isFetching,
        });
      }
    }
  );

  return { swapWarning, timeEstimate };
};
