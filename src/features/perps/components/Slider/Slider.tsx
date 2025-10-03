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

export const SLIDER_DEFAULT_SNAP_POINTS = Object.freeze([0, 0.25, 0.5, 0.75, 1]);
export const SLIDER_DEFAULT_WIDTH = 300;
export const SLIDER_MAX = 100;
export const SLIDER_MIN = 0;
export const SLIDER_PROGRESS_RANGE = Object.freeze([SLIDER_MIN, SLIDER_MAX]);

export interface SliderColors {
  activeLeft: string;
  inactiveLeft: string;
  activeRight: string;
  inactiveRight: string;
}

export type SliderVisualState = 'idle' | 'active' | 'processing';
export type SliderChangeSource = 'gesture' | 'tap' | 'max-button' | 'external';
export type SliderGestureState = 'idle' | 'active';

export type SliderProps = {
  colors?: SliderColors | SharedValue<SliderColors>;
  containerStyle?: ViewStyle;
  expandedHeight?: number;
  /** A shared value which if provided, tracks the current gesture state of the slider. */
  gestureState?: SharedValue<SliderGestureState>;
  height?: number;
  hitSlop?: {
    horizontal: number;
    vertical: number;
  };
  /** Initial slider progress used when no shared value is provided. */
  initialProgress?: number;
  isEnabled?: boolean | SharedValue<boolean>;
  /** A shared value which if provided, tracks the slider's progress target while animating. */
  nextTargetProgress?: SharedValue<number | undefined>;
  /** Called immediately when a slider gesture begins. */
  onGestureBeginWorklet?: () => void;
  /** Called when a gesture directly updates the slider progress. */
  onGestureUpdateWorklet?: (progress: number) => void;
  /** Called once when an interaction resolves and the slider animation has settled. */
  onProgressSettleWorklet?: (progress: number, source: SliderChangeSource) => void;
  /** Called immediately when the slider press is released. */
  onTouchesUpWorklet?: () => void;
  /** The slider progress from 0 to 100. */
  progressValue?: SharedValue<number>;
  /** If `true`, disables haptic feedback when the slider hits its left or right edge. */
  silenceEdgeHaptics?: boolean | SharedValue<boolean>;
  snapPoints?: readonly number[] | SharedValue<readonly number[]> | false;
  width?: number;
};

export const Slider: React.FC<SliderProps> = ({
  progressValue: progressValueProp,
  initialProgress = 0,
  isEnabled: isEnabledProp = true,
  colors: colorsProp,
  height = 10,
  expandedHeight = 16,
  width = SLIDER_DEFAULT_WIDTH,
  snapPoints: providedSnapPoints,
  nextTargetProgress,
  onGestureBeginWorklet,
  onGestureUpdateWorklet,
  onProgressSettleWorklet,
  onTouchesUpWorklet,
  containerStyle,
  hitSlop = { horizontal: 20, vertical: 40 },
  silenceEdgeHaptics,
  gestureState,
}) => {
  const { isDarkMode } = useColorMode();

  const snapPoints = useDerivedValue(() => {
    if (!providedSnapPoints) return SLIDER_DEFAULT_SNAP_POINTS;
    return 'value' in providedSnapPoints ? providedSnapPoints.value : providedSnapPoints;
  });

  const fillSecondary = useForegroundColor('fillSecondary');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const sliderPressProgress = useSharedValue(height / expandedHeight);
  const overshoot = useSharedValue(0);
  const internalProgressValue = useSharedValue(initialProgress);
  const progressValue = progressValueProp ?? internalProgressValue;
  const percentageValue = useDerivedValue(() => {
    return clamp(progressValue.value / SLIDER_MAX, 0, 1);
  });

  const gestureCtx = useSharedValue<{ startProgress: number }>({ startProgress: 0 });

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

  const uiXPercentage = useDerivedValue(() => {
    return clamp(percentageValue.value, 0, 1) * (1 - SCRUBBER_WIDTH / width);
  });

  const isSilenceHapticsBoolean = typeof silenceEdgeHaptics === 'boolean';

  // Haptic feedback for edges
  useAnimatedReaction(
    () => percentageValue.value,
    (current, previous) => {
      if (previous === null || current === previous) return;
      if (isSilenceHapticsBoolean ? silenceEdgeHaptics : silenceEdgeHaptics?.value) return;

      if (current >= MAX_PERCENTAGE && previous < MAX_PERCENTAGE) {
        triggerHaptics('impactMedium');
      }
      if (current < MIN_PERCENTAGE && previous >= MIN_PERCENTAGE) {
        triggerHaptics('impactLight');
      }
    },
    []
  );

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      sliderPressProgress.value = withSpring(1, SPRING_CONFIGS.sliderConfig);
      triggerHaptics('soft');
    })
    .onStart(() => {
      sliderPressProgress.value = withSpring(height / expandedHeight, SPRING_CONFIGS.sliderConfig);
    });

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          if (gestureState) gestureState.value = 'active';
          onGestureBeginWorklet?.();
          gestureCtx.modify(prev => {
            prev.startProgress = progressValue.value;
            return prev;
          });
          sliderPressProgress.value = withSpring(1, SPRING_CONFIGS.sliderConfig);
        })
        .onUpdate(event => {
          if (!isEnabled.value) return;

          const deltaProgress = (event.translationX / width) * SLIDER_MAX;
          const rawProgress = gestureCtx.value.startProgress + deltaProgress;

          const calculateOvershoot = (distance: number, maxOverscroll: number): number => {
            if (distance === 0) return 0;
            const overscrollFraction = Math.min(Math.abs(distance) / maxOverscroll, 1);
            const resistance = 1 / (overscrollFraction * 9 + 1);
            return distance * resistance;
          };

          const clampedProgress = clamp(rawProgress, SLIDER_MIN, SLIDER_MAX);
          progressValue.value = clampedProgress;
          onGestureUpdateWorklet?.(clampedProgress);

          const maxOverscroll = 80;
          const rawPixelPosition = (rawProgress / SLIDER_MAX) * width;
          const overshootX = interpolate(
            rawPixelPosition,
            [-maxOverscroll, 0, width, width + maxOverscroll],
            [-maxOverscroll, 0, 0, maxOverscroll],
            'clamp'
          );
          overshoot.value = calculateOvershoot(overshootX, maxOverscroll);
        })
        .onEnd(event => {
          const hasChanged = gestureCtx.value.startProgress !== progressValue.value;

          const resetOvershoot = () => {
            overshoot.value = withSpring(0, SPRING_CONFIGS.sliderConfig);
          };

          const finalizeAnimation = (progress: number) => {
            resetOvershoot();
            if (hasChanged) {
              onProgressSettleWorklet?.(progress, 'gesture');
            }
          };

          if (!isEnabled.value) {
            if (progressValue.value > 0) {
              if (nextTargetProgress) nextTargetProgress.value = 0;
              triggerHaptics('notificationError');
              progressValue.value = withSpring(0, SPRING_CONFIGS.slowSpring, () => {
                onProgressSettleWorklet?.(0, 'gesture');
                if (nextTargetProgress) nextTargetProgress.value = undefined;
              });
            }
            resetOvershoot();
            return;
          }

          const currentProgress = clamp(progressValue.value, SLIDER_MIN, SLIDER_MAX);
          const currentPercentage = currentProgress / SLIDER_MAX;

          if (currentPercentage >= MAX_PERCENTAGE) {
            if (nextTargetProgress) nextTargetProgress.value = SLIDER_MAX;
            resetOvershoot();
            progressValue.value = withSpring(SLIDER_MAX, SPRING_CONFIGS.snappySpringConfig, () => {
              onProgressSettleWorklet?.(SLIDER_MAX, 'gesture');
              if (nextTargetProgress) nextTargetProgress.value = undefined;
            });
            return;
          }

          if (currentPercentage <= MIN_PERCENTAGE) {
            if (nextTargetProgress) nextTargetProgress.value = 0;
            resetOvershoot();
            progressValue.value = withSpring(0, SPRING_CONFIGS.snappySpringConfig, () => {
              onProgressSettleWorklet?.(0, 'gesture');
              if (nextTargetProgress) nextTargetProgress.value = undefined;
            });
            return;
          }

          const currentSnapPoints = snapPoints.value;

          if (currentSnapPoints && currentSnapPoints.length > 0) {
            const deltaProgress = (event.translationX / width) * SLIDER_MAX;
            const rawProgress = gestureCtx.value.startProgress + deltaProgress;
            const rawPercentage = rawProgress / SLIDER_MAX;
            const minProgressDelta = MIN_PERCENTAGE * SLIDER_MAX;
            const needsToSnap =
              !(
                (currentPercentage === 0 && event.velocityX < 0) ||
                (currentPercentage === 1 && event.velocityX > 0) ||
                (overshoot.value !== 0 && (rawPercentage <= 0 || rawPercentage >= 1))
              ) && Math.abs(event.velocityX) > SLIDER_MAX;

            if (needsToSnap) {
              let nextSnapProgress: number | undefined;
              const progress = progressValue.value;

              if (event.velocityX > 0) {
                for (let i = 0; i < currentSnapPoints.length; i++) {
                  const candidate = currentSnapPoints[i] * SLIDER_MAX;
                  if (candidate > progress && candidate - progress > minProgressDelta) {
                    nextSnapProgress = candidate;
                    break;
                  }
                }
                nextSnapProgress = nextSnapProgress ?? SLIDER_MAX;
              } else {
                for (let i = currentSnapPoints.length - 1; i >= 0; i--) {
                  const candidate = currentSnapPoints[i] * SLIDER_MAX;
                  if (candidate < progress && progress - candidate > minProgressDelta) {
                    nextSnapProgress = candidate;
                    break;
                  }
                }
                nextSnapProgress = nextSnapProgress ?? SLIDER_MIN;
              }

              if (nextTargetProgress) nextTargetProgress.value = nextSnapProgress;
              resetOvershoot();
              progressValue.value = withSpring(nextSnapProgress, SPRING_CONFIGS.snappierSpringConfig, () => {
                onProgressSettleWorklet?.(nextSnapProgress, 'gesture');
                if (nextTargetProgress) nextTargetProgress.value = undefined;
              });
            } else {
              finalizeAnimation(currentProgress);
            }
          } else {
            const velocityProgress = (event.velocityX / width) * SLIDER_MAX;
            progressValue.value = withDecay(
              {
                velocity: Math.abs(velocityProgress) < 10 ? 0 : velocityProgress,
                velocityFactor: 1,
                clamp: [SLIDER_MIN, SLIDER_MAX],
                deceleration: 0.9925,
              },
              isFinished => {
                if (isFinished) {
                  const finalProgress = clamp(progressValue.value, SLIDER_MIN, SLIDER_MAX);
                  finalizeAnimation(finalProgress);
                }
              }
            );
          }
        })
        .onTouchesUp(() => {
          sliderPressProgress.value = withSpring(height / expandedHeight, SPRING_CONFIGS.sliderConfig);
          if (gestureState) gestureState.value = 'idle';
          onTouchesUpWorklet?.();
        })
        .activeOffsetX([0, 0])
        .activeOffsetY([0, 0]),
    [
      expandedHeight,
      gestureCtx,
      height,
      isEnabled,
      nextTargetProgress,
      onGestureUpdateWorklet,
      onProgressSettleWorklet,
      onTouchesUpWorklet,
      overshoot,
      progressValue,
      sliderPressProgress,
      snapPoints,
      width,
      gestureState,
      onGestureBeginWorklet,
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
            percentageValue.value,
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
            percentageValue.value,
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
              IS_IOS ? { borderColor: isDarkMode ? 'rgba(245, 248, 255, 0.015)' : 'rgba(26, 28, 31, 0.005)' } : undefined,
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
    borderCurve: 'continuous',
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
