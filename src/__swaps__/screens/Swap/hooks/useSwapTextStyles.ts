import {
  Easing,
  SharedValue,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useColorMode, useForegroundColor } from '@/design-system';

import {
  ETH_COLOR_DARK,
  ETH_COLOR_DARK_ACCENT,
  SLIDER_COLLAPSED_HEIGHT,
  SLIDER_HEIGHT,
  caretConfig,
  pulsingConfig,
  sliderConfig,
  slowFadeConfig,
} from '@/__swaps__/screens/Swap/constants';
import { inputKeys } from '@/__swaps__/types/swap';
import { getColorValueForThemeWorklet, opacity } from '@/__swaps__/utils/swaps';
import { useSwapInputsController } from './useSwapInputsController';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';

export function useSwapTextStyles({
  SwapInputController,
  internalSelectedInputAsset,
  internalSelectedOutputAsset,
  isQuoteStale,
  focusedInput,
  inputProgress,
  outputProgress,
  sliderPressProgress,
}: {
  SwapInputController: ReturnType<typeof useSwapInputsController>;
  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  isQuoteStale: SharedValue<number>;
  focusedInput: SharedValue<inputKeys>;
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  sliderPressProgress: SharedValue<number>;
}) {
  const { isDarkMode } = useColorMode();

  const labelSecondary = useForegroundColor('labelSecondary');
  const labelTertiary = useForegroundColor('labelTertiary');
  const zeroAmountColor = opacity(labelSecondary, 0.2);

  const isInputStale = useDerivedValue(() => {
    const isAdjustingOutputValue =
      SwapInputController.inputMethod.value === 'outputAmount' || SwapInputController.inputMethod.value === 'outputNativeValue';
    return isQuoteStale.value === 1 && isAdjustingOutputValue ? 1 : 0;
  });

  const isOutputStale = useDerivedValue(() => {
    const isAdjustingInputValue =
      SwapInputController.inputMethod.value === 'inputAmount' ||
      SwapInputController.inputMethod.value === 'inputNativeValue' ||
      SwapInputController.inputMethod.value === 'slider';
    return isQuoteStale.value === 1 && isAdjustingInputValue ? 1 : 0;
  });

  const pulsingOpacity = useDerivedValue(() => {
    return isQuoteStale.value === 1
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig);
  }, []);

  const inputAmountTextStyle = useAnimatedStyle(() => {
    const isInputZero =
      (SwapInputController.inputValues.value.inputAmount === 0 && SwapInputController.inputMethod.value !== 'slider') ||
      (SwapInputController.inputMethod.value === 'slider' && Number(SwapInputController.inputValues.value.inputAmount) === 0);
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    // eslint-disable-next-line no-nested-ternary
    const zeroOrAssetColor = isInputZero
      ? zeroAmountColor
      : getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true) === ETH_COLOR_DARK
        ? ETH_COLOR_DARK_ACCENT
        : getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true);
    const opacity = isInputStale.value !== 1 || (isInputZero && isOutputZero) ? withSpring(1, sliderConfig) : pulsingOpacity.value;

    return {
      color: withTiming(interpolateColor(isInputStale.value, [0, 1], [zeroOrAssetColor, zeroAmountColor]), slowFadeConfig),
      flexGrow: 0,
      flexShrink: 1,
      opacity,
    };
  });

  const inputNativeValueStyle = useAnimatedStyle(() => {
    const isInputZero =
      Number(SwapInputController.inputValues.value.inputAmount) === 0 ||
      (SwapInputController.inputMethod.value === 'slider' && Number(SwapInputController.inputValues.value.inputAmount) === 0);
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    const zeroOrColor = isInputZero ? zeroAmountColor : labelTertiary;
    const opacity = isInputStale.value !== 1 || (isInputZero && isOutputZero) ? withSpring(1, sliderConfig) : pulsingOpacity.value;

    return {
      color: withTiming(interpolateColor(isInputStale.value, [0, 1], [zeroOrColor, zeroAmountColor]), slowFadeConfig),
      opacity,
    };
  }, [isDarkMode]);

  const outputAmountTextStyle = useAnimatedStyle(() => {
    const isInputZero =
      Number(SwapInputController.inputValues.value.inputAmount) === 0 ||
      (SwapInputController.inputMethod.value === 'slider' && Number(SwapInputController.inputValues.value.inputAmount) === 0);
    const isOutputZero =
      (SwapInputController.inputValues.value.outputAmount === 0 && SwapInputController.inputMethod.value !== 'slider') ||
      (SwapInputController.inputMethod.value === 'slider' && Number(SwapInputController.inputValues.value.outputAmount) === 0);

    // eslint-disable-next-line no-nested-ternary
    const zeroOrAssetColor = isOutputZero
      ? zeroAmountColor
      : getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.color, isDarkMode, true) === ETH_COLOR_DARK
        ? ETH_COLOR_DARK_ACCENT
        : getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.color, isDarkMode, true);
    const opacity = isOutputStale.value !== 1 || (isInputZero && isOutputZero) ? withSpring(1, sliderConfig) : pulsingOpacity.value;

    return {
      color: withTiming(interpolateColor(isOutputStale.value, [0, 1], [zeroOrAssetColor, zeroAmountColor]), slowFadeConfig),
      flexGrow: 0,
      flexShrink: 1,
      opacity,
    };
  });

  const outputNativeValueStyle = useAnimatedStyle(() => {
    const isInputZero =
      Number(SwapInputController.inputValues.value.inputAmount) === 0 ||
      (SwapInputController.inputMethod.value === 'slider' && Number(SwapInputController.inputValues.value.inputAmount) === 0);
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    const zeroOrColor = isOutputZero ? zeroAmountColor : labelTertiary;
    const opacity = isOutputStale.value !== 1 || (isInputZero && isOutputZero) ? withSpring(1, sliderConfig) : pulsingOpacity.value;

    return {
      color: withTiming(interpolateColor(isOutputStale.value, [0, 1], [zeroOrColor, zeroAmountColor]), slowFadeConfig),
      opacity,
    };
  }, [isDarkMode]);

  // TODO: Create a reusable InputCaret component
  const inputCaretStyle = useAnimatedStyle(() => {
    const shouldShow =
      focusedInput.value === 'inputAmount' &&
      inputProgress.value === 0 &&
      outputProgress.value === 0 &&
      (SwapInputController.inputMethod.value !== 'slider' ||
        (SwapInputController.inputMethod.value === 'slider' && Number(SwapInputController.inputValues.value.inputAmount) === 0) ||
        (sliderPressProgress.value === SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT && isQuoteStale.value === 0));

    const opacity = shouldShow
      ? withRepeat(
          withSequence(
            withTiming(1, { duration: 0 }),
            withTiming(1, { duration: 400, easing: Easing.bezier(0.87, 0, 0.13, 1) }),
            withTiming(0, caretConfig),
            withTiming(1, caretConfig)
          ),
          -1,
          true
        )
      : withTiming(0, caretConfig);

    const isZero =
      (SwapInputController.inputMethod.value !== 'slider' && SwapInputController.inputValues.value.inputAmount === 0) ||
      (SwapInputController.inputMethod.value === 'slider' && Number(SwapInputController.inputValues.value.inputAmount) === 0);

    return {
      display: shouldShow ? 'flex' : 'none',
      opacity,
      position: isZero ? 'absolute' : 'relative',
    };
  });

  const outputCaretStyle = useAnimatedStyle(() => {
    const shouldShow =
      focusedInput.value === 'outputAmount' &&
      inputProgress.value === 0 &&
      outputProgress.value === 0 &&
      (SwapInputController.inputMethod.value !== 'slider' ||
        (SwapInputController.inputMethod.value === 'slider' && Number(SwapInputController.inputValues.value.inputAmount) === 0) ||
        (sliderPressProgress.value === SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT && isQuoteStale.value === 0));

    const opacity = shouldShow
      ? withRepeat(
          withSequence(
            withTiming(1, { duration: 0 }),
            withTiming(1, { duration: 400, easing: Easing.bezier(0.87, 0, 0.13, 1) }),
            withTiming(0, caretConfig),
            withTiming(1, caretConfig)
          ),
          -1,
          true
        )
      : withTiming(0, caretConfig);

    const isZero =
      (SwapInputController.inputMethod.value !== 'slider' && SwapInputController.inputValues.value.outputAmount === 0) ||
      (SwapInputController.inputMethod.value === 'slider' && Number(SwapInputController.inputValues.value.inputAmount) === 0);

    return {
      display: shouldShow ? 'flex' : 'none',
      opacity,
      position: isZero ? 'absolute' : 'relative',
    };
  });

  return {
    inputAmountTextStyle,
    inputCaretStyle,
    inputNativeValueStyle,
    outputAmountTextStyle,
    outputCaretStyle,
    outputNativeValueStyle,
  };
}
