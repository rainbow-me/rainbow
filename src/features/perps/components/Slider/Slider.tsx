import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
  SharedValue,
  clamp,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { SCRUBBER_WIDTH, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

const MAX_PERCENTAGE = 0.995;
const MIN_PERCENTAGE = 0.005;

export const SLIDER_DEFAULT_WIDTH = 300;

export interface SliderColors {
  activeLeft: string;
  inactiveLeft: string;
  activeRight: string;
  inactiveRight: string;
}

export type SliderVisualState = 'idle' | 'active' | 'processing';
export type SliderChangeSource = 'gesture' | 'tap' | 'max-button' | 'external';

export interface SliderProps {
  sliderXPosition: SharedValue<number>;
  isEnabled?: boolean | SharedValue<boolean>;
  colors?: SliderColors | SharedValue<SliderColors>;
  height?: number;
  expandedHeight?: number;
  width?: number;
  /**
   * If `true`, disables haptic feedback when the slider hits its left or right edge.
   */
  silenceEdgeHaptics?: SharedValue<boolean>;
  snapPoints?: number[] | false;
  onPercentageChange?: (percentage: number, source: SliderChangeSource) => void;
  onPercentageUpdate?: (percentage: number) => void;
  containerStyle?: ViewStyle;
  hitSlop?: {
    horizontal: number;
    vertical: number;
  };
}

const DEFAULT_SNAP_POINTS = Object.freeze([0, 0.25, 0.5, 0.75, 1]);

export const Slider: React.FC<SliderProps> = ({
  sliderXPosition,
  isEnabled: isEnabledProp = true,
  colors: colorsProp,
  height = 10,
  expandedHeight = 16,
  width = SLIDER_DEFAULT_WIDTH,
  snapPoints: providedSnapPoints,
  onPercentageChange,
  onPercentageUpdate,
  containerStyle,
  hitSlop = { horizontal: 20, vertical: 40 },
  silenceEdgeHaptics,
}) => {
  const { isDarkMode } = useColorMode();
  const snapPoints = providedSnapPoints ?? DEFAULT_SNAP_POINTS;

  const fillSecondary = useForegroundColor('fillSecondary');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const sliderPressProgress = useSharedValue(height / expandedHeight);
  const overshoot = useSharedValue(0);
  const gestureCtx = useSharedValue<{ startX: number }>({ startX: 0 });

  const isEnabled = useDerivedValue(() => {
    if (typeof isEnabledProp === 'boolean') return isEnabledProp;
    return isEnabledProp.value;
  });

  const defaultColors = useDerivedValue<SliderColors>(() => ({
    activeLeft: isDarkMode ? '#00D4FF' : '#0076FF',
    inactiveLeft: isDarkMode ? opacityWorklet('#00D4FF', 0.9) : opacityWorklet('#0076FF', 0.9),
    activeRight: fillSecondary,
    inactiveRight: separatorSecondary,
  }));

  const colors = useDerivedValue(() => {
    if (!colorsProp) return defaultColors.value;
    if ('value' in colorsProp) return colorsProp.value;
    return colorsProp;
  });

  const xPercentage = useDerivedValue(() => {
    return clamp((sliderXPosition.value - SCRUBBER_WIDTH / width) / width, 0, 1);
  });

  const uiXPercentage = useDerivedValue(() => {
    return xPercentage.value * (1 - SCRUBBER_WIDTH / width);
  });

  // Haptic feedback for edges
  useAnimatedReaction(
    () => sliderXPosition.value,
    (current, previous) => {
      if (previous === null || current === previous || silenceEdgeHaptics?.value) return;

      if (current >= width * MAX_PERCENTAGE && previous < width * MAX_PERCENTAGE) {
        triggerHaptics('impactMedium');
      }
      if (current < width * MIN_PERCENTAGE && previous >= width * MIN_PERCENTAGE) {
        triggerHaptics('impactLight');
      }
    },
    []
  );

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      'worklet';
      sliderPressProgress.value = withSpring(1, SPRING_CONFIGS.sliderConfig);
      triggerHaptics('soft');
    })
    .onStart(() => {
      'worklet';
      sliderPressProgress.value = withSpring(height / expandedHeight, SPRING_CONFIGS.sliderConfig);
    });

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          'worklet';
          gestureCtx.modify(prev => {
            prev.startX = sliderXPosition.value;
            return prev;
          });
          sliderPressProgress.value = withSpring(1, SPRING_CONFIGS.sliderConfig);
        })
        .onUpdate(event => {
          'worklet';
          if (!isEnabled.value) return;

          const rawX = gestureCtx.value.startX + event.translationX;

          const calculateOvershoot = (distance: number, maxOverscroll: number): number => {
            if (distance === 0) return 0;
            const overscrollFraction = Math.min(Math.abs(distance) / maxOverscroll, 1);
            const resistance = 1 / (overscrollFraction * 9 + 1);
            return distance * resistance;
          };

          sliderXPosition.value = clamp(rawX, 0, width);

          // Handle overscroll
          if (rawX < 0 || rawX > width) {
            const maxOverscroll = 80;
            const overshootX = interpolate(
              rawX,
              [-maxOverscroll, 0, width, width + maxOverscroll],
              [-maxOverscroll, 0, 0, maxOverscroll],
              'clamp'
            );
            overshoot.value = calculateOvershoot(overshootX, maxOverscroll);
          }

          const sliderX = sliderXPosition.value;
          const isAtMax = sliderX >= width * MAX_PERCENTAGE;
          const isAtMin = sliderX <= width * MIN_PERCENTAGE;

          onPercentageUpdate?.(isAtMax ? 1 : isAtMin ? 0 : xPercentage.value);
        })
        .onEnd(event => {
          'worklet';
          const hasChanged = gestureCtx.value.startX !== sliderXPosition.value;

          const onFinished = () => {
            overshoot.value = withSpring(0, SPRING_CONFIGS.sliderConfig);

            if (isEnabled.value) {
              if (xPercentage.value >= MAX_PERCENTAGE) {
                onPercentageChange?.(1, 'gesture');
                sliderXPosition.value = withSpring(width, SPRING_CONFIGS.snappySpringConfig);
              } else if (xPercentage.value < MIN_PERCENTAGE) {
                onPercentageChange?.(0, 'gesture');
                sliderXPosition.value = withSpring(0, SPRING_CONFIGS.snappySpringConfig);
              } else if (hasChanged) {
                onPercentageChange?.(xPercentage.value, 'gesture');
              }
            }
          };

          sliderPressProgress.value = withSpring(height / expandedHeight, SPRING_CONFIGS.sliderConfig);

          const sliderX = sliderXPosition.value;

          if (!isEnabled.value) {
            if (sliderX > 0) triggerHaptics('notificationError');
            overshoot.value = withSpring(0, SPRING_CONFIGS.sliderConfig);
            sliderXPosition.value = withSpring(0, SPRING_CONFIGS.slowSpring);
            return;
          }

          if (snapPoints && snapPoints.length > 0) {
            // Snap point logic
            const rawX = gestureCtx.value.startX + event.translationX;
            const needsToSnap =
              !(
                (sliderX === 0 && event.velocityX < 0) ||
                (sliderX === width && event.velocityX > 0) ||
                (overshoot.value !== 0 && (rawX <= 0 || rawX >= width))
              ) && Math.abs(event.velocityX) > 100;

            if (needsToSnap) {
              const adjustedSnapPoints = snapPoints.map((point: number) => point * width);
              let nextSnapPoint: number | undefined = undefined;

              if (event.velocityX > 0) {
                for (let i = 0; i < adjustedSnapPoints.length; i++) {
                  if (adjustedSnapPoints[i] > sliderX && adjustedSnapPoints[i] - sliderX > width * MIN_PERCENTAGE) {
                    nextSnapPoint = adjustedSnapPoints[i];
                    break;
                  }
                }
                nextSnapPoint = nextSnapPoint ?? width;
              } else {
                for (let i = adjustedSnapPoints.length - 1; i >= 0; i--) {
                  if (adjustedSnapPoints[i] < sliderX && sliderX - adjustedSnapPoints[i] > width * MIN_PERCENTAGE) {
                    nextSnapPoint = adjustedSnapPoints[i];
                    break;
                  }
                }
                nextSnapPoint = nextSnapPoint ?? 0;
              }

              overshoot.value = withSpring(0, SPRING_CONFIGS.sliderConfig);
              onPercentageChange?.(nextSnapPoint / width, 'gesture');
              sliderXPosition.value = withSpring(nextSnapPoint, SPRING_CONFIGS.snappierSpringConfig);
            } else {
              onFinished();
            }
          } else {
            // Decay animation without snap points
            sliderXPosition.value = withDecay(
              {
                velocity: Math.abs(event.velocityX) < 100 ? 0 : event.velocityX,
                velocityFactor: 1,
                clamp: [0, width],
                deceleration: 0.9925,
              },
              isFinished => {
                if (isFinished) onFinished();
              }
            );
          }
        })
        .activeOffsetX([0, 0])
        .activeOffsetY([0, 0]),
    [
      expandedHeight,
      gestureCtx,
      height,
      isEnabled,
      onPercentageChange,
      onPercentageUpdate,
      overshoot,
      sliderPressProgress,
      sliderXPosition,
      snapPoints,
      width,
      xPercentage,
    ]
  );

  const sliderContainerStyle = useAnimatedStyle(() => {
    const collapsedPercentage = height / expandedHeight;
    return {
      height: interpolate(sliderPressProgress.value, [collapsedPercentage, 1], [height, expandedHeight]),
      transform: [
        { translateX: overshoot.value * 0.75 },
        { scaleX: interpolate(sliderPressProgress.value, [collapsedPercentage, 1], [1, 1.025]) + Math.abs(overshoot.value) / width },
        { scaleY: interpolate(sliderPressProgress.value, [collapsedPercentage, 1], [1, 1.025]) - (Math.abs(overshoot.value) / width) * 3 },
      ],
    };
  });

  const leftBarContainerStyle = useAnimatedStyle(() => {
    const collapsedPercentage = height / expandedHeight;
    return {
      backgroundColor: withSpring(
        interpolateColor(sliderPressProgress.value, [collapsedPercentage, 1], [colors.value.inactiveLeft, colors.value.activeLeft]),
        SPRING_CONFIGS.springConfig
      ),
      borderWidth: IS_IOS
        ? interpolate(
            xPercentage.value,
            [0, (THICK_BORDER_WIDTH * 2) / width, (THICK_BORDER_WIDTH * 4) / width, 1],
            [0, 0, THICK_BORDER_WIDTH, THICK_BORDER_WIDTH],
            'clamp'
          )
        : 0,
      width: `${uiXPercentage.value * 100}%`,
    };
  });

  const rightBarContainerStyle = useAnimatedStyle(() => {
    return {
      borderWidth: IS_IOS
        ? interpolate(
            xPercentage.value,
            [0, 1 - (THICK_BORDER_WIDTH * 4) / width, 1 - (THICK_BORDER_WIDTH * 2) / width, 1],
            [THICK_BORDER_WIDTH, THICK_BORDER_WIDTH, 0, 0],
            'clamp'
          )
        : 0,
      backgroundColor: colors.value.inactiveRight,
      width: `${(1 - uiXPercentage.value - SCRUBBER_WIDTH / width) * 100}%`,
    };
  });

  const composedGesture = Gesture.Simultaneous(tapGesture, panGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <View
        style={{
          marginVertical: -hitSlop.vertical,
          paddingVertical: hitSlop.vertical,
          marginHorizontal: -hitSlop.horizontal,
          paddingHorizontal: hitSlop.horizontal,
        }}
      >
        <Animated.View
          style={[
            sliderContainerStyle,
            containerStyle,
            {
              alignItems: 'center',
              flexDirection: 'row',
              width,
            },
          ]}
        >
          {/* Left bar */}
          <Animated.View style={[styles.sliderBox, { borderColor: separatorSecondary }, leftBarContainerStyle]} />
          {/* Scrubber */}
          <Box style={styles.sliderScrubberContainer}>
            <Box style={[styles.sliderScrubber, { backgroundColor: isDarkMode ? globalColors.white100 : globalColors.grey80 }]} />
          </Box>
          {/* Right bar */}
          <Box
            as={Animated.View}
            style={[
              styles.sliderBox,
              rightBarContainerStyle,
              { borderColor: isDarkMode ? 'rgba(245, 248, 255, 0.015)' : 'rgba(26, 28, 31, 0.005)' },
            ]}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  sliderBox: {
    borderCurve: 'continuous',
    borderRadius: 8,
    height: '100%',
    overflow: 'hidden',
  },
  sliderScrubber: {
    borderRadius: 4,
    height: `${250 / 3}%`,
    width: 4,
  },
  sliderScrubberContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: SCRUBBER_WIDTH,
  },
});
