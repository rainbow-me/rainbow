import {
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

import { ETH_COLOR_DARK, ETH_COLOR_DARK_ACCENT, pulsingConfig } from '@/__swaps__/screens/Swap/constants';
import { inputMethods, inputValuesType } from '@/__swaps__/types/swap';
import { getColorValueForThemeWorklet, opacity } from '@/__swaps__/utils/swaps';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { equalWorklet } from '@/safe-math/SafeMath';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';

export function useSwapTextStyles({
  inputMethod,
  inputValues,
  internalSelectedInputAsset,
  internalSelectedOutputAsset,
  isFetching,
  isQuoteStale,
}: {
  inputMethod: SharedValue<inputMethods>;
  inputValues: SharedValue<inputValuesType>;
  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  isFetching: SharedValue<boolean>;
  isQuoteStale: SharedValue<number>;
}) {
  const { isDarkMode } = useColorMode();

  const labelSecondary = useForegroundColor('labelSecondary');
  const labelTertiary = useForegroundColor('labelTertiary');
  const zeroAmountColor = opacity(labelSecondary, 0.2);

  const isInputStale = useDerivedValue(() => {
    const inputAndOutputAssetsExist = internalSelectedInputAsset.value && internalSelectedOutputAsset.value;
    const isAdjustingOutputValue = inputMethod.value === 'outputAmount' || inputMethod.value === 'outputNativeValue';

    return (isQuoteStale.value === 1 || isFetching.value) && inputAndOutputAssetsExist && isAdjustingOutputValue ? 1 : 0;
  });

  const isOutputStale = useDerivedValue(() => {
    const inputAndOutputAssetsExist = internalSelectedInputAsset.value && internalSelectedOutputAsset.value;
    const isAdjustingInputValue =
      inputMethod.value === 'inputAmount' || inputMethod.value === 'inputNativeValue' || inputMethod.value === 'slider';

    return (isQuoteStale.value === 1 || isFetching.value) && inputAndOutputAssetsExist && isAdjustingInputValue ? 1 : 0;
  });

  const pulsingOpacity = useDerivedValue(() => {
    return isQuoteStale.value === 1
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, SPRING_CONFIGS.sliderConfig);
  });

  const isInputZero = useDerivedValue(() => {
    const isInputAmountZero = inputValues.value.inputAmount === 0;
    if (!internalSelectedInputAsset.value) return true;

    if (inputMethod.value === 'slider' && equalWorklet(inputValues.value.inputAmount, 0)) return true;

    if (inputMethod.value === 'inputNativeValue' && isInputAmountZero) {
      return inputValues.value.inputNativeValue === 0;
    }

    return isInputAmountZero;
  });

  const isOutputZero = useDerivedValue(() => {
    const isOutputAmountZero = inputValues.value.outputAmount === 0;

    if (!internalSelectedOutputAsset.value) return true;

    if (inputMethod.value === 'slider' && equalWorklet(inputValues.value.inputAmount, 0)) return true;

    if (inputMethod.value === 'outputNativeValue' && isOutputAmountZero) {
      return inputValues.value.outputNativeValue === 0;
    }

    return isOutputAmountZero;
  });

  const inputAssetColor = useDerivedValue(() => {
    const color = getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode);
    return color === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : color;
  });

  const outputAssetColor = useDerivedValue(() => {
    const color = getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.highContrastColor, isDarkMode);
    return color === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : color;
  });

  const inputAmountTextStyle = useAnimatedStyle(() => {
    // eslint-disable-next-line no-nested-ternary
    const zeroOrAssetColor = isInputZero.value
      ? zeroAmountColor
      : inputAssetColor.value === ETH_COLOR_DARK
        ? ETH_COLOR_DARK_ACCENT
        : inputAssetColor.value;
    const opacity =
      isInputStale.value !== 1 || (isInputZero.value && isOutputZero.value)
        ? withSpring(1, SPRING_CONFIGS.sliderConfig)
        : pulsingOpacity.value;

    return {
      color: interpolateColor(isInputStale.value, [0, 1], [zeroOrAssetColor, zeroAmountColor]),
      flexGrow: 0,
      flexShrink: 1,
      opacity,
    };
  });

  const inputNativeValueStyle = useAnimatedStyle(() => {
    const zeroOrColor = isInputZero.value ? zeroAmountColor : labelTertiary;
    const opacity =
      isInputStale.value !== 1 || (isInputZero.value && isOutputZero.value)
        ? withSpring(1, SPRING_CONFIGS.sliderConfig)
        : pulsingOpacity.value;

    return {
      color: withTiming(interpolateColor(isInputStale.value, [0, 1], [zeroOrColor, zeroAmountColor]), TIMING_CONFIGS.slowFadeConfig),
      opacity,
    };
  });

  const outputAmountTextStyle = useAnimatedStyle(() => {
    // eslint-disable-next-line no-nested-ternary
    const zeroOrAssetColor = isOutputZero.value
      ? zeroAmountColor
      : outputAssetColor.value === ETH_COLOR_DARK
        ? ETH_COLOR_DARK_ACCENT
        : outputAssetColor.value;
    const opacity =
      isOutputStale.value !== 1 || (isInputZero.value && isOutputZero.value)
        ? withSpring(1, SPRING_CONFIGS.sliderConfig)
        : pulsingOpacity.value;

    return {
      color: interpolateColor(isOutputStale.value, [0, 1], [zeroOrAssetColor, zeroAmountColor]),
      flexGrow: 0,
      flexShrink: 1,
      opacity,
    };
  });

  const outputNativeValueStyle = useAnimatedStyle(() => {
    const zeroOrColor = isOutputZero.value ? zeroAmountColor : labelTertiary;
    const opacity =
      isOutputStale.value !== 1 || (isInputZero.value && isOutputZero.value)
        ? withSpring(1, SPRING_CONFIGS.sliderConfig)
        : pulsingOpacity.value;

    return {
      color: withTiming(interpolateColor(isOutputStale.value, [0, 1], [zeroOrColor, zeroAmountColor]), TIMING_CONFIGS.slowFadeConfig),
      opacity,
    };
  });

  return {
    inputAmountTextStyle,
    inputNativeValueStyle,
    outputAmountTextStyle,
    outputNativeValueStyle,
  };
}
