import { useCallback } from 'react';
import { useAccountSettings } from '@/hooks';
import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { convertAmountToNativeDisplay, divide, greaterThanOrEqualTo, subtract } from '@/__swaps__/utils/numbers';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';
import { BigNumberish } from '@/__swaps__/utils/hex';

const highPriceImpactThreshold = 0.05;
const severePriceImpactThreshold = 0.1;

export enum SwapPriceImpactType {
  none = 'none',
  high = 'high',
  severe = 'severe',
}

export interface SwapPriceImpact {
  type: SwapPriceImpactType;
  impactDisplay: string;
}

type UsePriceImpactWarningProps = {
  SwapInputController: ReturnType<typeof useSwapInputsController>;
  sliderXPosition: SharedValue<number>;
  isFetching: SharedValue<boolean>;
};

export const usePriceImpactWarning = ({ SwapInputController, isFetching, sliderXPosition }: UsePriceImpactWarningProps) => {
  const { nativeCurrency: currentCurrency } = useAccountSettings();

  const priceImpact = useSharedValue<SwapPriceImpact>({
    type: SwapPriceImpactType.none,
    impactDisplay: '',
  });

  const calculatePriceImpact = useCallback(
    ({
      inputNativeValue,
      outputNativeValue,
      isFetching,
    }: {
      inputNativeValue: BigNumberish;
      outputNativeValue: BigNumberish;
      isFetching: boolean;
    }) => {
      const nativeAmountImpact = subtract(inputNativeValue, outputNativeValue);
      const impact = divide(nativeAmountImpact, inputNativeValue);

      const impactDisplay = convertAmountToNativeDisplay(nativeAmountImpact, currentCurrency);

      const updatePriceImpact = (values: SwapPriceImpact) => {
        'worklet';

        priceImpact.modify(prev => ({
          ...prev,
          ...values,
        }));
      };

      if (!isFetching && greaterThanOrEqualTo(impact, severePriceImpactThreshold)) {
        runOnUI(updatePriceImpact)({
          type: SwapPriceImpactType.severe,
          impactDisplay,
        });
      } else if (!isFetching && greaterThanOrEqualTo(impact, highPriceImpactThreshold)) {
        runOnUI(updatePriceImpact)({
          type: SwapPriceImpactType.high,
          impactDisplay,
        });
      } else {
        runOnUI(updatePriceImpact)({
          type: SwapPriceImpactType.none,
          impactDisplay,
        });
      }
    },
    [currentCurrency, priceImpact]
  );

  useAnimatedReaction(
    () => ({
      inputNativeValue: SwapInputController.inputValues.value.inputNativeValue,
      outputNativeValue: SwapInputController.inputValues.value.outputNativeValue,
      isFetching: isFetching.value,
      sliderXPosition: sliderXPosition.value,
    }),
    (current, previous) => {
      if (!current.inputNativeValue || !current.outputNativeValue) {
        priceImpact.value = { impactDisplay: '', type: SwapPriceImpactType.none };
        return;
      }

      // NOTE: While the user is scrubbing the slider, we don't want to show the price impact warning.
      if (previous?.sliderXPosition && previous?.sliderXPosition !== current.sliderXPosition) {
        priceImpact.value = { impactDisplay: '', type: SwapPriceImpactType.none };
        return;
      }

      if (previous?.inputNativeValue !== current.inputNativeValue || previous?.outputNativeValue !== current.outputNativeValue) {
        if (!current.inputNativeValue || !current.outputNativeValue) {
          priceImpact.value = { impactDisplay: '', type: SwapPriceImpactType.none };
          return;
        }

        runOnJS(calculatePriceImpact)({
          inputNativeValue: current.inputNativeValue,
          outputNativeValue: current.outputNativeValue,
          isFetching: current.isFetching,
        });
      }
    }
  );

  return priceImpact;
};
