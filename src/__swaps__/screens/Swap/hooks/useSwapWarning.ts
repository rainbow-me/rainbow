import { useCallback } from 'react';
import { useAccountSettings } from '@/hooks';
import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { convertAmountToNativeDisplay, divide, greaterThanOrEqualTo, subtract } from '@/__swaps__/utils/numbers';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';
import { BigNumberish } from '@/__swaps__/utils/hex';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { getCrossChainTimeEstimate, getQuoteServiceTime } from '@/__swaps__/utils/swaps';

const highPriceImpactThreshold = 0.05;
const severePriceImpactThreshold = 0.1;

export enum SwapWarningType {
  unknown = 'unknown',
  none = 'none',
  high = 'high',
  severe = 'severe',
  long_wait = 'long_wait',
}

export interface SwapWarning {
  type: SwapWarningType;
  display: string;
}

type UsePriceImpactWarningProps = {
  SwapInputController: ReturnType<typeof useSwapInputsController>;
  sliderXPosition: SharedValue<number>;
  isFetching: SharedValue<boolean>;
};

export const useSwapWarning = ({ SwapInputController, isFetching, sliderXPosition }: UsePriceImpactWarningProps) => {
  const { nativeCurrency: currentCurrency } = useAccountSettings();

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
       * We want to show severe/high price impact warnings if they exists
       * if those are not present, we want to show the long wait warning
       * if there is no price impact at all, we want to show none
       */
      if (!isFetching && greaterThanOrEqualTo(impact, severePriceImpactThreshold)) {
        runOnUI(updateWarning)({
          type: SwapWarningType.severe,
          display,
        });
      } else if (!isFetching && greaterThanOrEqualTo(impact, highPriceImpactThreshold)) {
        runOnUI(updateWarning)({
          type: SwapWarningType.high,
          display,
        });
      } else if (!(quote as QuoteError).error) {
        const serviceTime = getQuoteServiceTime({
          quote: quote as CrosschainQuote,
        });
        const timeEstimate = serviceTime
          ? getCrossChainTimeEstimate({
              serviceTime,
            })
          : null;

        if (timeEstimate?.isLongWait) {
          runOnUI(updateWarning)({
            type: SwapWarningType.long_wait,
            display: timeEstimate.timeEstimateDisplay,
          });
          return;
        }
      } else {
        runOnUI(updateWarning)({
          type: SwapWarningType.none,
          display,
        });
      }
    },
    [currentCurrency, swapWarning]
  );

  useAnimatedReaction(
    () => ({
      inputNativeValue: SwapInputController.inputValues.value.inputNativeValue,
      outputNativeValue: SwapInputController.inputValues.value.outputNativeValue,
      quote: SwapInputController.quote.value,
      isFetching: isFetching.value,
      sliderXPosition: sliderXPosition.value,
    }),
    (current, previous) => {
      if (current?.isFetching) {
        swapWarning.value = { display: '', type: SwapWarningType.none };
        return;
      }
      // NOTE: While the user is scrubbing the slider, we don't want to show the price impact warning.
      if (previous?.sliderXPosition && previous?.sliderXPosition !== current.sliderXPosition) {
        swapWarning.value = { display: '', type: SwapWarningType.none };
        return;
      }

      if (previous?.inputNativeValue !== current.inputNativeValue || previous?.outputNativeValue !== current.outputNativeValue) {
        runOnJS(getWarning)({
          inputNativeValue: current.inputNativeValue,
          outputNativeValue: current.outputNativeValue,
          quote: current.quote,
          isFetching: current.isFetching,
        });
      }
    }
  );

  return swapWarning;
};
