import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, Cover, Text, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { HYPERLIQUID_COLORS } from '@/features/perps/constants';
import chroma from 'chroma-js';
import { StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';

const HOLD_TO_SWAP_DURATION_MS = 400;

const HoldProgress = ({ holdProgress, color }: { holdProgress: SharedValue<number>; color: string }) => {
  const { isDarkMode } = useColorMode();

  const brightenedColor = chroma(color)
    .saturate(isDarkMode ? 0.15 : 0.1)
    .brighten(isDarkMode ? 0.5 : 0.3)
    .css();

  const holdProgressStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(holdProgress?.value, [0, 4, 20, 96, 100], [0, 0, 1, 1, 0], 'clamp'),
      width: `${holdProgress?.value ?? 0}%`,
    };
  });

  return (
    <Cover style={{ borderRadius: 100, overflow: 'hidden' }}>
      <Animated.View
        style={[
          holdProgressStyle,
          {
            backgroundColor: brightenedColor,
            height: '100%',
            ...(IS_IOS
              ? {
                  shadowColor: brightenedColor,
                  shadowOffset: {
                    width: 12,
                    height: 0,
                  },
                  shadowOpacity: 1,
                  shadowRadius: 6,
                }
              : {}),
          },
        ]}
      />
    </Cover>
  );
};

export const PerpsSwapButton = ({
  onLongPress,
  style,
  testID,
  label,
  disabled,
  disabledOpacity = 0.4,
}: {
  label: string;
  style?: ViewStyle;
  testID?: string;
  onLongPress: () => void;
  disabled?: boolean;
  disabledOpacity?: number;
}) => {
  const labelColor = useForegroundColor('label');
  const holdProgress = useSharedValue(0);
  const containerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(disabled ? disabledOpacity : 1, TIMING_CONFIGS.slowerFadeConfig),
  }));
  return (
    <GestureHandlerButton
      testID={testID}
      longPressDuration={HOLD_TO_SWAP_DURATION_MS}
      onLongPressJS={onLongPress}
      style={style}
      scaleTo={0.9}
      disabled={disabled}
      onLongPressEndWorklet={success => {
        'worklet';
        if (!success) {
          holdProgress.value = withSpring(0, SPRING_CONFIGS.slowSpring);
        }
      }}
      onLongPressWorklet={() => {
        'worklet';
        triggerHaptics('notificationSuccess');
      }}
      onPressStartWorklet={() => {
        'worklet';
        holdProgress.value = 0;
        holdProgress.value = withTiming(100, { duration: HOLD_TO_SWAP_DURATION_MS, easing: Easing.inOut(Easing.sin) }, isFinished => {
          if (isFinished) {
            holdProgress.value = 0;
          }
        });
      }}
    >
      <Box
        as={Animated.View}
        style={containerStyle}
        borderRadius={24}
        height={48}
        justifyContent={'center'}
        alignItems={'center'}
        borderWidth={2}
        borderColor={{ custom: opacityWorklet(labelColor, 0.16) }}
      >
        <LinearGradient
          colors={HYPERLIQUID_COLORS.gradient}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000', opacity: 0.12 }]} />
        <HoldProgress holdProgress={holdProgress} color={HYPERLIQUID_COLORS.green} />
        <Text size="20pt" weight={'black'} color={{ custom: '#000000' }}>
          {label}
        </Text>
      </Box>
    </GestureHandlerButton>
  );
};
