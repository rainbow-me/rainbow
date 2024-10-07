import { SharedValue } from 'react-native-reanimated';
import { inputKeys, inputMethods, inputValuesType } from '@/__swaps__/types/swap';
import { valueBasedDecimalFormatter } from '@/__swaps__/utils/decimalFormatter';
import { niceIncrementFormatter } from '@/__swaps__/utils/swaps';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { divWorklet, equalWorklet, greaterThanWorklet, mulWorklet } from '@/safe-math/SafeMath';

export function getInputValuesForSliderPositionWorklet({
  selectedInputAsset,
  percentageToSwap,
  sliderXPosition,
}: {
  selectedInputAsset: ExtendedAnimatedAssetWithColors | null;
  percentageToSwap: number;
  sliderXPosition: number;
}) {
  'worklet';
  const inputAssetMaxSwappableBalance = selectedInputAsset?.maxSwappableAmount || 0;
  const isStablecoin = selectedInputAsset?.type === 'stablecoin';

  const inputAmount = niceIncrementFormatter({
    inputAssetBalance: inputAssetMaxSwappableBalance,
    inputAssetNativePrice: selectedInputAsset?.price?.value ?? 0,
    percentageToSwap,
    sliderXPosition,
    stripSeparators: true,
    isStablecoin,
  });

  const inputNativeValue = mulWorklet(inputAmount, selectedInputAsset?.price?.value ?? 0);

  return {
    inputAmount,
    inputNativeValue,
  };
}

export const updateInputValuesAfterFlip = ({
  internalSelectedInputAsset,
  internalSelectedOutputAsset,
  inputValues,
  percentageToSwap,
  sliderXPosition,
  inputMethod,
  lastTypedInput,
  focusedInput,
}: {
  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  inputValues: SharedValue<inputValuesType>;
  percentageToSwap: SharedValue<number>;
  sliderXPosition: SharedValue<number>;
  inputMethod: SharedValue<inputMethods>;
  lastTypedInput: SharedValue<inputKeys>;
  focusedInput: SharedValue<inputKeys>;
}) => {
  'worklet';
  const inputNativePrice = internalSelectedInputAsset.value?.nativePrice || internalSelectedInputAsset.value?.price?.value || 0;
  const outputNativePrice = internalSelectedOutputAsset.value?.nativePrice || internalSelectedOutputAsset.value?.price?.value || 0;
  const hasNonZeroInputPrice = greaterThanWorklet(inputNativePrice, 0);
  const hasNonZeroOutputPrice = greaterThanWorklet(outputNativePrice, 0);

  const inputBalance = internalSelectedInputAsset.value?.maxSwappableAmount || 0;
  const hasInputBalance = greaterThanWorklet(inputBalance, 0);

  const prevInputNativeValue = inputValues.value.inputNativeValue;

  const outputBalance = internalSelectedOutputAsset.value?.maxSwappableAmount || 0;
  const hasOutputBalance = greaterThanWorklet(outputBalance, 0);

  const calculatedInputAmount: string | number = greaterThanWorklet(inputNativePrice, 0)
    ? divWorklet(prevInputNativeValue, inputNativePrice)
    : 0;
  const newFormattedInputAmount = valueBasedDecimalFormatter({
    amount: calculatedInputAmount,
    nativePrice: inputNativePrice,
    roundingMode: 'up',
    isStablecoin: internalSelectedInputAsset.value?.type === 'stablecoin',
    stripSeparators: true,
  });

  let newInputAmount: string | number = newFormattedInputAmount;
  let newOutputAmount: string | number = 0;

  const exceedsMaxBalance = greaterThanWorklet(newInputAmount, inputBalance);
  const validBalanceIfAny = (hasInputBalance && !exceedsMaxBalance) || !hasInputBalance;

  // determine if we previously had max selected and can still set max on the new input
  const prevInputAmount = inputValues.value.inputAmount;
  const setToMax = hasInputBalance && hasOutputBalance && equalWorklet(prevInputAmount, outputBalance);

  if (hasNonZeroInputPrice && hasNonZeroOutputPrice && validBalanceIfAny && !setToMax) {
    // use previous native input amount if available
    const prevOutputNativeValue = inputValues.value.outputNativeValue;
    newOutputAmount = divWorklet(prevOutputNativeValue, outputNativePrice);
    inputMethod.value = 'inputAmount';
  } else if (hasInputBalance && hasOutputBalance) {
    // use slider position if available
    const { inputAmount: inputAmountBasedOnSlider } = getInputValuesForSliderPositionWorklet({
      selectedInputAsset: internalSelectedInputAsset.value,
      percentageToSwap: percentageToSwap.value,
      sliderXPosition: sliderXPosition.value,
    });
    newInputAmount = inputAmountBasedOnSlider;
    inputMethod.value = 'slider';
    lastTypedInput.value = 'inputAmount';
    focusedInput.value = 'inputAmount';
    inputValues.modify(values => {
      return {
        ...values,
        inputAmount: newInputAmount,
        inputNativeValue: mulWorklet(newInputAmount, inputNativePrice),
      };
    });
    return;
  } else {
    inputMethod.value = 'inputAmount';
    const prevOutputAmount = inputValues.value.outputAmount;

    if (prevOutputAmount) {
      // use previous output amount if available
      newInputAmount = prevOutputAmount;
      newOutputAmount = prevInputAmount;
    } else {
      // otherwise, reset to 0
      newInputAmount = 0;
      newOutputAmount = 0;
    }
  }

  inputValues.modify(values => {
    return {
      ...values,
      inputAmount: newInputAmount,
      inputNativeValue: mulWorklet(newInputAmount, inputNativePrice),
      outputAmount: newOutputAmount,
      outputNativeValue: mulWorklet(newOutputAmount, outputNativePrice),
    };
  });
};
