import React from 'react';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Bleed, Box, Columns, HitSlop, Separator, Text, useColorMode, useForegroundColor } from '@/design-system';
import { stripCommas } from '@/__swaps__/utils/swaps';
import {
  CUSTOM_KEYBOARD_HEIGHT,
  LIGHT_SEPARATOR_COLOR,
  LONG_PRESS_DELAY_DURATION,
  LONG_PRESS_REPEAT_DURATION,
  SEPARATOR_COLOR,
  THICK_BORDER_WIDTH,
  buttonPressConfig,
  fadeConfig,
} from '@/__swaps__/screens/Swap/constants';
import { LongPressGestureHandler, LongPressGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { ButtonPressAnimation } from '@/components/animations';
import { colors } from '@/styles';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';

type numberPadCharacter = number | 'backspace' | '.';

export const SwapNumberPad = () => {
  const { isDarkMode } = useColorMode();
  const { focusedInput, SwapInputsController, configProgress } = useSwapContext();

  const longPressTimer = useSharedValue(0);

  const addNumber = (number?: number) => {
    'worklet';
    // immediately stop the quote fetching interval
    SwapInputsController.quoteFetchingInterval.stop();

    const inputKey = focusedInput.value;
    if (SwapInputsController.inputMethod.value !== inputKey) {
      SwapInputsController.inputMethod.value = inputKey;

      if (typeof SwapInputsController.inputValues.value[inputKey] === 'number') {
        SwapInputsController.inputValues.modify(value => {
          return {
            ...value,
            [inputKey]:
              inputKey === 'inputAmount'
                ? stripCommas(SwapInputsController.formattedInputAmount.value)
                : stripCommas(SwapInputsController.formattedOutputAmount.value),
          };
        });
      }
    }
    const currentValue = SwapInputsController.inputValues.value[inputKey];
    const newValue = currentValue === 0 || currentValue === '0' ? `${number}` : `${currentValue}${number}`;

    SwapInputsController.inputValues.modify(value => {
      return {
        ...value,
        [inputKey]: newValue,
      };
    });
  };

  const addDecimalPoint = () => {
    'worklet';
    const inputKey = focusedInput.value;
    const currentValue = SwapInputsController.inputValues.value[inputKey].toString();
    if (!currentValue.includes('.')) {
      if (SwapInputsController.inputMethod.value !== inputKey) {
        SwapInputsController.inputMethod.value = inputKey;

        SwapInputsController.inputValues.modify(values => {
          return {
            ...values,
            [inputKey]:
              inputKey === 'inputAmount'
                ? stripCommas(SwapInputsController.formattedInputAmount.value)
                : stripCommas(SwapInputsController.formattedOutputAmount.value),
          };
        });
      }

      const newValue = `${currentValue}.`;

      SwapInputsController.inputValues.modify(values => {
        return {
          ...values,
          [inputKey]: newValue,
        };
      });
    }
  };

  const deleteLastCharacter = () => {
    'worklet';
    const inputKey = focusedInput.value;
    if (SwapInputsController.inputMethod.value !== inputKey) {
      SwapInputsController.inputMethod.value = inputKey;

      SwapInputsController.inputValues.modify(values => {
        return {
          ...values,
          [inputKey]:
            inputKey === 'inputAmount'
              ? stripCommas(SwapInputsController.formattedInputAmount.value)
              : stripCommas(SwapInputsController.formattedOutputAmount.value),
        };
      });
    }
    const currentValue = SwapInputsController.inputValues.value[inputKey].toString();
    // Handle deletion, ensuring a placeholder zero remains if the entire number is deleted
    const newValue = currentValue.length > 1 ? currentValue.slice(0, -1) : 0;
    if (newValue === 0) {
      SwapInputsController.inputValues.modify(values => {
        return {
          ...values,
          inputAmount: 0,
          inputNativeValue: 0,
          outputAmount: 0,
          outputNativeValue: 0,
        };
      });
    } else {
      SwapInputsController.inputValues.modify(values => {
        return {
          ...values,
          [inputKey]: newValue,
        };
      });
    }
  };

  const numpadContainerStyles = useAnimatedStyle(() => {
    return {
      opacity:
        configProgress.value === NavigationSteps.SHOW_REVIEW || configProgress.value === NavigationSteps.SHOW_GAS
          ? withTiming(0, fadeConfig)
          : withTiming(1, fadeConfig),
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
  longPressTimer?: Animated.SharedValue<number>;
  onPressWorklet: (number?: number) => void;
  small?: boolean;
  transparent?: boolean;
}) => {
  const { isDarkMode } = useColorMode();

  const pressProgress = useSharedValue(0);

  const scale = useDerivedValue(() => {
    return withTiming(pressProgress.value === 1 ? 0.95 : 1, buttonPressConfig);
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

  // TODO: Refactor to use GestureDetector
  const onLongPress = useAnimatedGestureHandler<LongPressGestureHandlerGestureEvent>({
    onActive: (_, context: { alreadyTriggered?: boolean }) => {
      if (!context.alreadyTriggered) {
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
      }

      context.alreadyTriggered = true;
    },
    onFinish: (_, context: { alreadyTriggered?: boolean }) => {
      pressProgress.value = 0;
      if (longPressTimer !== undefined) {
        longPressTimer.value = 0;
      }
      context.alreadyTriggered = false;
    },
  });

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
        onPressWorklet();
      } else if (longPressTimer !== undefined) {
        longPressTimer.value === 0;
      }
    },
    []
  );

  const pressStyle = useAnimatedStyle(() => {
    const fill = isDarkMode ? separatorSecondary : 'rgba(255, 255, 255, 0.72)';
    const pressedFill = isDarkMode ? separator : 'rgba(255, 255, 255, 1)';

    const backgroundColor = transparent ? 'transparent' : fill;
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
    // @ts-expect-error
    <LongPressGestureHandler
      // This 0.1ms activation delay gives ButtonPressAnimation time to trigger
      // haptic feedback natively before the LongPressGestureHandler takes over
      minDurationMs={0.1}
      onGestureEvent={onLongPress}
      shouldCancelWhenOutside
    >
      <Animated.View accessible accessibilityRole="button">
        <HitSlop space="3px">
          <ButtonPressAnimation scaleTo={1} useLateHaptic={false}>
            <Box
              alignItems="center"
              as={Animated.View}
              borderRadius={8}
              height={{ custom: 46 }}
              justifyContent="center"
              style={[
                !transparent && {
                  borderColor: isDarkMode ? separatorTertiary : 'transparent',
                  borderCurve: 'continuous',
                  borderWidth: THICK_BORDER_WIDTH,
                  shadowColor: isDarkMode ? 'transparent' : colors.dark,
                  shadowOffset: {
                    width: 0,
                    height: isDarkMode ? 4 : 4,
                  },
                  shadowOpacity: isDarkMode ? 0 : 0.1,
                  shadowRadius: 6,
                },
                pressStyle,
              ]}
            >
              <Text align="center" color="label" size={small ? '22pt' : '26pt'} weight="semibold">
                {char === 'backspace' ? '􀆛' : char}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </HitSlop>
      </Animated.View>
    </LongPressGestureHandler>
  );
};
