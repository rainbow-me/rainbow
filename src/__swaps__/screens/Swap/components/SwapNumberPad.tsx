import React from 'react';
import Animated, {
  Easing,
  SharedValue,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { supportedNativeCurrencies } from '@/references';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Bleed, Box, Columns, HitSlop, Separator, Text, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { equalWorklet } from '@/safe-math/SafeMath';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { colors } from '@/styles';
import {
  CUSTOM_KEYBOARD_HEIGHT,
  LIGHT_SEPARATOR_COLOR,
  LONG_PRESS_DELAY_DURATION,
  LONG_PRESS_REPEAT_DURATION,
  SEPARATOR_COLOR,
  THICK_BORDER_WIDTH,
} from '@/__swaps__/screens/Swap/constants';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { InputKeys } from '@/__swaps__/types/swap';
import { opacityWorklet, stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { GestureHandlerButton } from './GestureHandlerButton';

type numberPadCharacter = number | 'backspace' | '.';

const getFormattedInputKey = (inputKey: InputKeys) => {
  'worklet';
  switch (inputKey) {
    case 'inputAmount':
      return 'formattedInputAmount';
    case 'inputNativeValue':
      return 'formattedInputNativeValue';
    case 'outputAmount':
      return 'formattedOutputAmount';
    case 'outputNativeValue':
      return 'formattedOutputNativeValue';
  }
};

export const SwapNumberPad = () => {
  const { isDarkMode } = useColorMode();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const {
    SwapInputController,
    configProgress,
    focusedInput,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isQuoteStale,
    outputQuotesAreDisabled,
  } = useSwapContext();

  const { inputMethod, inputNativePrice, inputValues, outputNativePrice, quoteFetchingInterval } = SwapInputController;

  const longPressTimer = useSharedValue(0);

  const removeFormatting = (inputKey: InputKeys) => {
    'worklet';
    return stripNonDecimalNumbers(SwapInputController[getFormattedInputKey(inputKey)].value);
  };

  const ignoreChange = ({ currentValue, addingDecimal = false }: { currentValue?: string; addingDecimal?: boolean }) => {
    'worklet';
    const inputKey = focusedInput.value;

    // ignore when: outputQuotesAreDisabled and we are updating the output amount or output native value
    if ((inputKey === 'outputAmount' || inputKey === 'outputNativeValue') && outputQuotesAreDisabled.value) {
      return true;
    }

    // ignore when: number of entered decimal places exceeds max precision
    if (inputKey === 'inputAmount' || (inputKey === 'outputAmount' && currentValue?.includes('.'))) {
      const isInputFocused = inputKey === 'inputAmount';
      const currentDecimals = currentValue?.split('.')?.[1]?.length ?? -1;
      const maxDecimals = (isInputFocused ? internalSelectedInputAsset.value?.decimals : internalSelectedOutputAsset.value?.decimals) ?? 18;
      if (currentDecimals >= maxDecimals) return true;
    }

    // ignore when: corresponding asset does not have a price and we are updating native inputs
    if ((inputKey === 'outputNativeValue' && !outputNativePrice.value) || (inputKey === 'inputNativeValue' && !inputNativePrice.value)) {
      return true;
    }

    // ignore when: decimals exceed native currency decimals
    if (currentValue) {
      const currentValueDecimals = currentValue.split('.')?.[1]?.length ?? -1;
      const nativeCurrencyDecimals = supportedNativeCurrencies[nativeCurrency].decimals;

      const isNativePlaceholderValue = equalWorklet(currentValue, 0) && inputMethod.value !== inputKey;

      if (addingDecimal && nativeCurrencyDecimals === 0) {
        return true;
      } else if (
        (inputKey === 'inputNativeValue' || inputKey === 'outputNativeValue') &&
        !isNativePlaceholderValue &&
        currentValueDecimals >= nativeCurrencyDecimals
      ) {
        return true;
      }
    }
    return false;
  };

  const addNumber = (number?: number) => {
    'worklet';
    const inputKey = focusedInput.value;
    const currentValue = removeFormatting(inputKey);

    if (ignoreChange({ currentValue })) return;

    // Immediately stop the quote fetching interval
    quoteFetchingInterval.stop();

    const currentInputMethod = inputMethod.value;

    const isNativePlaceholderValue =
      equalWorklet(currentValue, 0) &&
      currentInputMethod !== inputKey &&
      (inputKey === 'inputNativeValue' || inputKey === 'outputNativeValue');

    const newValue = currentValue === '0' || isNativePlaceholderValue ? `${number}` : `${currentValue}${number}`;

    // For a uint256, the maximum value is:
    // 2e256 − 1 = 115792089237316195423570985008687907853269984665640564039457584007913129639935
    // This value has 78 digits.
    if (newValue.length > 78) return;

    // Make the quote stale only when the number in the input actually changes
    if (Number(newValue) !== 0 && !(currentValue.includes('.') && number === 0)) {
      isQuoteStale.value = 1;
    }

    if (currentInputMethod !== inputKey) {
      inputMethod.value = inputKey;
    }

    inputValues.modify(value => ({
      ...value,
      [inputKey]: newValue,
    }));
  };

  const addDecimalPoint = () => {
    'worklet';
    const inputKey = focusedInput.value;
    const currentValue = removeFormatting(inputKey);

    if (ignoreChange({ currentValue, addingDecimal: true })) {
      return;
    }

    if (!currentValue.includes('.')) {
      if (inputMethod.value !== inputKey) {
        inputMethod.value = inputKey;
      }

      const newValue = `${currentValue}.`;

      inputValues.modify(values => ({
        ...values,
        [inputKey]: newValue,
      }));
    }
  };

  const deleteLastCharacter = () => {
    'worklet';

    if (ignoreChange({})) {
      return;
    }

    const inputKey = focusedInput.value;

    if (inputMethod.value !== inputKey) {
      inputMethod.value = inputKey;
    }

    const currentValue = removeFormatting(inputKey);
    // Handle deletion, ensuring a placeholder zero remains if the entire number is deleted
    const newValue = currentValue.length > 1 ? currentValue.slice(0, -1) : 0;

    // Make the quote stale only when the number in the input actually changes
    if (!currentValue.endsWith('.') && !equalWorklet(currentValue, newValue)) {
      isQuoteStale.value = 1;
    }

    if (newValue === 0) {
      inputValues.modify(values => ({
        ...values,
        inputAmount: 0,
        inputNativeValue: 0,
        outputAmount: 0,
        outputNativeValue: 0,
      }));
    } else {
      inputValues.modify(values => ({
        ...values,
        [inputKey]: newValue,
      }));
    }
  };

  const numpadContainerStyles = useAnimatedStyle(() => {
    return {
      opacity:
        configProgress.value === NavigationSteps.SHOW_REVIEW ||
        configProgress.value === NavigationSteps.SHOW_GAS ||
        configProgress.value === NavigationSteps.SHOW_SETTINGS
          ? withTiming(0, TIMING_CONFIGS.fadeConfig)
          : withTiming(1, TIMING_CONFIGS.fadeConfig),
    };
  });

  return (
    <Box as={Animated.View} style={numpadContainerStyles} height={{ custom: CUSTOM_KEYBOARD_HEIGHT }} paddingHorizontal="6px" width="full">
      <Box style={{ gap: 6 }} width="full">
        <Bleed horizontal="6px">
          <Separator
            color={{
              custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR,
            }}
            thickness={1}
          />
        </Bleed>
        <Columns space="6px">
          <NumberPadKey char={1} onPressWorklet={addNumber} />
          <NumberPadKey char={2} onPressWorklet={addNumber} />
          <NumberPadKey char={3} onPressWorklet={addNumber} />
        </Columns>
        <Columns space="6px">
          <NumberPadKey char={4} onPressWorklet={addNumber} />
          <NumberPadKey char={5} onPressWorklet={addNumber} />
          <NumberPadKey char={6} onPressWorklet={addNumber} />
        </Columns>
        <Columns space="6px">
          <NumberPadKey char={7} onPressWorklet={addNumber} />
          <NumberPadKey char={8} onPressWorklet={addNumber} />
          <NumberPadKey char={9} onPressWorklet={addNumber} />
        </Columns>
        <Columns space="6px">
          <NumberPadKey char="." onPressWorklet={addDecimalPoint} transparent />
          <NumberPadKey char={0} onPressWorklet={addNumber} />
          <NumberPadKey char="backspace" longPressTimer={longPressTimer} onPressWorklet={deleteLastCharacter} small transparent />
        </Columns>
      </Box>
    </Box>
  );
};

const NumberPadKey = ({
  char,
  longPressTimer,
  onPressWorklet,
  small,
  transparent,
}: {
  char: numberPadCharacter;
  longPressTimer?: SharedValue<number>;
  onPressWorklet: (number?: number) => void;
  small?: boolean;
  transparent?: boolean;
}) => {
  const {
    SwapInputController: { inputValues },
    focusedInput,
  } = useSwapContext();
  const { isDarkMode } = useColorMode();

  const pressProgress = useSharedValue(0);

  const scale = useDerivedValue(() => {
    return withTiming(pressProgress.value === 1 ? 0.95 : 1, TIMING_CONFIGS.buttonPressConfig);
  });

  const backgroundColorProgress = useDerivedValue(() => {
    return pressProgress.value === 1
      ? withTiming(1, {
          duration: 50,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        })
      : withTiming(0);
  });

  const separator = useForegroundColor('separator');
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  useAnimatedReaction(
    () => Math.floor(((longPressTimer?.value ?? 0) * 1000) / LONG_PRESS_REPEAT_DURATION),
    (current, previous) => {
      if (
        pressProgress.value === 1 &&
        longPressTimer !== undefined &&
        previous &&
        current > previous &&
        current > Math.floor(LONG_PRESS_DELAY_DURATION / LONG_PRESS_REPEAT_DURATION)
      ) {
        const inputValue = inputValues.value[focusedInput.value];

        if (inputValue !== 0) {
          triggerHaptics('selection');
          onPressWorklet();
        }
      } else if (longPressTimer !== undefined) {
        longPressTimer.value === 0;
      }
    },
    []
  );

  const pressStyle = useAnimatedStyle(() => {
    const fill = isDarkMode ? separatorSecondary : 'rgba(255, 255, 255, 0.72)';
    const pressedFill = isDarkMode ? separator : 'rgba(255, 255, 255, 1)';

    const backgroundColor = transparent ? opacityWorklet(fill, 0) : fill;
    const pressedColor = transparent ? fill : pressedFill;

    return {
      backgroundColor: interpolateColor(backgroundColorProgress.value, [0, 1], [backgroundColor, pressedColor]),
      transform: [
        {
          scale: scale.value,
        },
      ],
    };
  }, [isDarkMode]);

  return (
    <HitSlop space="3px">
      <GestureHandlerButton
        disableScale
        longPressDuration={0}
        onLongPressEndWorklet={() => {
          'worklet';
          pressProgress.value = 0;
          if (longPressTimer !== undefined) {
            longPressTimer.value = 0;
          }
        }}
        onLongPressWorklet={() => {
          'worklet';
          pressProgress.value = 1;
          if (typeof char === 'number') {
            onPressWorklet(char);
          } else {
            onPressWorklet();
          }

          if (longPressTimer !== undefined && char === 'backspace') {
            longPressTimer.value = 0;
            longPressTimer.value = withTiming(10, { duration: 10000, easing: Easing.linear });
          } else {
            pressProgress.value = withDelay(500, withTiming(0, { duration: 0 }));
          }
        }}
      >
        <Animated.View
          style={[
            !transparent && {
              borderColor: isDarkMode ? separatorTertiary : 'transparent',
              borderCurve: 'continuous',
              borderWidth: IS_IOS ? THICK_BORDER_WIDTH : 0,
              shadowColor: isDarkMode ? 'transparent' : colors.dark,
              shadowOffset: {
                width: 0,
                height: isDarkMode ? 4 : 4,
              },
              shadowOpacity: isDarkMode ? 0 : 0.1,
              shadowRadius: 6,
            },
            {
              alignItems: 'center',
              borderRadius: 8,
              height: 46,
              justifyContent: 'center',
            },
            pressStyle,
          ]}
        >
          <Text align="center" color="label" size={small ? '22pt' : '26pt'} weight="semibold">
            {char === 'backspace' ? '􀆛' : char}
          </Text>
        </Animated.View>
      </GestureHandlerButton>
    </HitSlop>
  );
};
