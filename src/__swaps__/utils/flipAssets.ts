import { SharedValue, withSpring } from 'react-native-reanimated';
import { NativeCurrencyKey } from '@/entities';
import { supportedNativeCurrencies } from '@/references';
import { divWorklet, equalWorklet, greaterThanWorklet, mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { InputKeys, InputMethods, InputValues } from '@/__swaps__/types/swap';
import { valueBasedDecimalFormatter } from '@/__swaps__/utils/decimalFormatter';
import { niceIncrementFormatter } from '@/__swaps__/utils/swaps';
import { INITIAL_SLIDER_POSITION, SLIDER_WIDTH, snappySpringConfig } from '../screens/Swap/constants';

export function getInputValuesForSliderPositionWorklet({
  inputNativePrice,
  percentageToSwap,
  selectedInputAsset,
  sliderXPosition,
}: {
  inputNativePrice: number;
  percentageToSwap: number;
  selectedInputAsset: ExtendedAnimatedAssetWithColors | null;
  sliderXPosition: number;
}) {
  'worklet';
  const inputAssetBalance = selectedInputAsset?.maxSwappableAmount || 0;
  const isStablecoin = selectedInputAsset?.type === 'stablecoin';
  const shouldSetToMax = percentageToSwap === 1 && inputAssetBalance;
  const inputPrice = (inputNativePrice || selectedInputAsset?.nativePrice || selectedInputAsset?.price?.value) ?? 0;

  const inputAmount = shouldSetToMax
    ? inputAssetBalance
    : niceIncrementFormatter({
        inputAssetBalance,
        inputAssetNativePrice: inputPrice,
        isStablecoin,
        percentageToSwap,
        sliderXPosition,
        stripSeparators: true,
      });

  const inputNativeValue = mulWorklet(inputAmount, inputPrice);

  return {
    inputAmount,
    inputNativeValue,
  };
}

export const updateInputValuesAfterFlip = ({
  areAllInputsZero,
  currency,
  inputMethod,
  inputNativePrice,
  inputValues,
  internalSelectedInputAsset,
  internalSelectedOutputAsset,
  lastTypedInput,
  outputNativePrice,
  resetValuesToZeroWorklet,
  sliderXPosition,
}: {
  areAllInputsZero: boolean;
  currency: NativeCurrencyKey;
  inputMethod: SharedValue<InputMethods>;
  inputNativePrice: number;
  inputValues: SharedValue<InputValues>;
  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  lastTypedInput: InputKeys;
  outputNativePrice: number;
  resetValuesToZeroWorklet: ({ updateSlider, inputKey }: { updateSlider: boolean; inputKey?: InputKeys }) => void;
  sliderXPosition: SharedValue<number>;
}) => {
  'worklet';
  const inputBalance = internalSelectedInputAsset.value?.maxSwappableAmount;
  const hasInputBalance = inputBalance !== undefined && greaterThanWorklet(inputBalance, 0);

  if (!hasInputBalance && (areAllInputsZero || !inputNativePrice)) {
    inputMethod.value = 'inputAmount';
    resetValuesToZeroWorklet({ updateSlider: true });
    return;
  }

  const outputBalance = internalSelectedOutputAsset.value?.maxSwappableAmount || 0;
  const currencyDecimals = supportedNativeCurrencies[currency].decimals;
  const initialNativeInputAmount = inputValues.value.inputNativeValue.toString().includes('.')
    ? toFixedWorklet(inputValues.value.inputNativeValue, currencyDecimals)
    : inputValues.value.inputNativeValue;

  let newSliderXPosition: number | null = null;
  let newInputValues: Pick<InputValues, 'inputAmount' | 'inputNativeValue'> & Partial<InputValues> = {
    inputAmount:
      inputNativePrice === 0
        ? 0
        : valueBasedDecimalFormatter({
            amount: divWorklet(initialNativeInputAmount, inputNativePrice),
            isStablecoin: internalSelectedInputAsset.value?.type === 'stablecoin',
            nativePrice: inputNativePrice,
            roundingMode: 'up',
            stripSeparators: true,
          }),
    inputNativeValue: initialNativeInputAmount,
  };

  const hasNonZeroBalance = hasInputBalance && greaterThanWorklet(inputBalance, 0);
  const wasSetToMax =
    outputBalance && greaterThanWorklet(outputBalance, 0) ? equalWorklet(inputValues.value.inputAmount, outputBalance) : false;
  const shouldSetToMax =
    hasNonZeroBalance && (wasSetToMax || greaterThanWorklet(newInputValues.inputAmount, mulWorklet(inputBalance, 0.99)));

  inputMethod.value = lastTypedInput === 'inputNativeValue' && !shouldSetToMax && inputNativePrice ? 'inputNativeValue' : 'inputAmount';

  if (hasNonZeroBalance) {
    if (shouldSetToMax) {
      newInputValues.inputAmount = inputBalance;
      newSliderXPosition = SLIDER_WIDTH;
    } else if (areAllInputsZero) {
      const { inputAmount, inputNativeValue } = getInputValuesForSliderPositionWorklet({
        inputNativePrice,
        percentageToSwap: INITIAL_SLIDER_POSITION,
        selectedInputAsset: internalSelectedInputAsset.value,
        sliderXPosition: INITIAL_SLIDER_POSITION * SLIDER_WIDTH,
      });
      newInputValues.inputAmount = inputAmount;
      newInputValues.inputNativeValue = inputNativeValue;
      newSliderXPosition = INITIAL_SLIDER_POSITION * SLIDER_WIDTH;
    } else {
      newSliderXPosition = Number(mulWorklet(divWorklet(newInputValues.inputAmount, inputBalance), SLIDER_WIDTH));
    }
  } else {
    newSliderXPosition = 0;
  }

  newInputValues = {
    ...newInputValues,
    outputAmount: outputNativePrice ? divWorklet(newInputValues.inputNativeValue, outputNativePrice) : inputValues.value.inputAmount,
    outputNativeValue: newInputValues.inputNativeValue,
  };

  if (newSliderXPosition !== null) sliderXPosition.value = withSpring(newSliderXPosition, snappySpringConfig);

  inputValues.modify(values => {
    values.inputAmount = newInputValues.inputAmount;
    values.inputNativeValue = newInputValues.inputNativeValue;
    if (newInputValues.outputAmount) values.outputAmount = newInputValues.outputAmount;
    if (newInputValues.outputNativeValue) values.outputNativeValue = newInputValues.outputNativeValue;
    return values;
  });
};
