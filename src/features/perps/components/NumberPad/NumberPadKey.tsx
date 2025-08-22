import Animated, {
  SharedValue,
  useSharedValue,
  useDerivedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  Easing,
  interpolateColor,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { HitSlop, Text, useColorMode, useForegroundColor } from '@/design-system';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { colors } from '@/styles';
import { IS_IOS } from '@/env';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

const LONG_PRESS_DELAY_DURATION = 400;
const LONG_PRESS_REPEAT_DURATION = 100;

export type NumberPadCharacter = number | 'backspace' | '.';

export type NumberPadField = {
  id: string;
  value: string | number;
  maxDecimals?: number;
  maxLength?: number;
  allowDecimals?: boolean;
  allowNegative?: boolean;
};

export const NumberPadKey = ({
  char,
  longPressTimer,
  onPressWorklet,
  small,
  transparent,
  fields,
  activeFieldId,
}: {
  char: NumberPadCharacter;
  longPressTimer?: SharedValue<number>;
  onPressWorklet: (number?: number) => void;
  small?: boolean;
  transparent?: boolean;
  fields: SharedValue<Record<string, NumberPadField>>;
  activeFieldId: SharedValue<string>;
}) => {
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

  // Handle long press for backspace
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
        const fieldId = activeFieldId.value;
        const field = fields.value[fieldId];

        if (field && field.value !== 0 && field.value !== '0') {
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
  }, [isDarkMode, transparent]);

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
