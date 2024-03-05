import React, { ReactElement, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, TapGestureHandler, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedText, Bleed, Box, Column, Columns, Inline, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { triggerHapticFeedback } from '@/screens/points/constants';
import { deviceUtils } from '@/utils';

import {
  SCRUBBER_WIDTH,
  SLIDER_COLLAPSED_HEIGHT,
  SLIDER_HEIGHT,
  THICK_BORDER_WIDTH,
  pulsingConfig,
  sliderConfig,
  slowFadeConfig,
  snappierSpringConfig,
  snappySpringConfig,
  springConfig,
} from '../constants';
import { inputMethods } from '../types';
import { clamp, opacity } from '../utils';

type SwapSliderProps = {
  bottomColor: string;
  coinIcon: ReactElement;
  dualColor?: boolean;
  height?: number;
  initialPercentage?: number;
  inputMethod: Animated.SharedValue<inputMethods>;
  isQuoteStale: Animated.SharedValue<number>;
  onChange: (percentage: number) => void;
  pressProgress: Animated.SharedValue<number>;
  snapPoints?: number[];
  topColor: string;
  width?: number;
  x: Animated.SharedValue<number>;
};

export const SwapSlider = ({
  bottomColor,
  coinIcon,
  dualColor,
  height = SLIDER_HEIGHT,
  initialPercentage = 0,
  inputMethod,
  isQuoteStale,
  onChange,
  pressProgress,
  snapPoints,
  topColor,
  width = deviceUtils.dimensions.width - 40,
  x,
}: SwapSliderProps) => {
  const { isDarkMode } = useColorMode();

  const panRef = useRef();
  const tapRef = useRef();

  const fillSecondary = useForegroundColor('fillSecondary');
  const labelSecondary = useForegroundColor('labelSecondary');
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const zeroAmountColor = opacity(labelSecondary, 0.2);

  const overshoot = useSharedValue(0);

  // Callback function to handle percentage change once slider is at rest
  const onChangeWrapper = useCallback(
    (percentage: number) => {
      onChange(percentage);
    },
    [onChange]
  );

  const { inactiveColorLeft, activeColorLeft, inactiveColorRight, activeColorRight } = useMemo(
    () => ({
      inactiveColorLeft: opacity(dualColor ? bottomColor : topColor, 0.9),
      activeColorLeft: dualColor ? bottomColor : topColor,
      inactiveColorRight: dualColor ? opacity(topColor, 0.9) : separatorSecondary,
      activeColorRight: dualColor ? topColor : fillSecondary,
    }),
    [bottomColor, dualColor, fillSecondary, separatorSecondary, topColor]
  );

  // This is the percentage of the slider from the left
  const xPercentage = useDerivedValue(() => {
    return clamp((x.value - SCRUBBER_WIDTH / width) / width, 0, 1);
  }, [x.value]);

  // This is a hacky way to prevent the slider from shifting when it reaches the right limit
  const uiXPercentage = useDerivedValue(() => {
    return xPercentage.value * (1 - SCRUBBER_WIDTH / width);
  }, [xPercentage.value]);

  const percentageText = useDerivedValue(() => {
    return `${Math.round((xPercentage.value ?? initialPercentage) * 100)}%`;
  }, [xPercentage.value]);

  useAnimatedReaction(
    () => ({ x: x.value }),
    (current, previous) => {
      if (current !== previous && inputMethod.value === 'slider') {
        if (current.x >= width * 0.995 && previous?.x && previous?.x < width * 0.995) {
          runOnJS(triggerHapticFeedback)('impactMedium');
        }
        if (current.x < width * 0.005 && previous?.x && previous?.x >= width * 0.005) {
          runOnJS(triggerHapticFeedback)('impactLight');
        }
      }
    },
    []
  );

  const onPressDown = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onStart: () => {
      pressProgress.value = withSpring(1, sliderConfig);
    },
    onActive: () => {
      pressProgress.value = withSpring(SLIDER_COLLAPSED_HEIGHT / height, sliderConfig);
    },
  });

  const onSlide = useAnimatedGestureHandler({
    onStart: (event, ctx: { startX: number }) => {
      ctx.startX = x.value;
      pressProgress.value = withSpring(1, sliderConfig);
      inputMethod.value = 'slider';
    },
    onActive: (event, ctx: { startX: number }) => {
      const rawX = ctx.startX + event.translationX || 0;

      const calculateOvershoot = (distance: number, maxOverscroll: number): number => {
        if (distance === 0) return 0;

        const overscrollFraction = Math.min(Math.abs(distance) / maxOverscroll, 1);
        const resistance = 1 / (overscrollFraction * 9 + 1);
        const adjustedMovement = distance * resistance;

        return adjustedMovement;
      };

      if (ctx.startX === width && clamp(rawX, 0, width) >= width * 0.995) {
        isQuoteStale.value = 0;
      } else if (isQuoteStale.value === 0) {
        isQuoteStale.value = 1;
      }

      x.value = clamp(rawX, 0, width);

      // Handle slider overscroll
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
    },
    onFinish: (event, ctx: { startX: number }) => {
      const onFinished = () => {
        overshoot.value = withSpring(0, sliderConfig);
        if (xPercentage.value >= 0.995) {
          if (isQuoteStale.value === 1) {
            runOnJS(onChangeWrapper)(1);
          }
          x.value = withSpring(width, snappySpringConfig);
        } else if (xPercentage.value < 0.005) {
          runOnJS(onChangeWrapper)(0);
          x.value = withSpring(0, snappySpringConfig);
          // isQuoteStale.value = 0;
        } else {
          runOnJS(onChangeWrapper)(xPercentage.value);
        }
      };

      pressProgress.value = withSpring(SLIDER_COLLAPSED_HEIGHT / height, sliderConfig);

      if (snapPoints) {
        // If snap points are provided and velocity is high enough, snap to the nearest point
        const rawX = ctx.startX + event.translationX || 0;

        // Skip snapping if the slider is already at 0% or 100% and the user is overscrolling
        const needsToSnap =
          !(
            (x.value === 0 && event.velocityX < 0) ||
            (x.value === width && event.velocityX > 0) ||
            (overshoot.value !== 0 && (rawX <= 0 || rawX >= width))
          ) && Math.abs(event.velocityX) > 100; // Skip snapping if velocity is low

        if (needsToSnap) {
          const adjustedSnapPoints = snapPoints.map((point: number) => point * width);
          let nextSnapPoint: number | undefined = undefined;
          const xWithVelocity = x.value;

          // If velocity is positive, find the next snap point to the right
          if (event.velocityX > 0) {
            for (let i = 0; i < adjustedSnapPoints.length; i++) {
              if (adjustedSnapPoints[i] > xWithVelocity && adjustedSnapPoints[i] - xWithVelocity > width * 0.005) {
                nextSnapPoint = adjustedSnapPoints[i];
                break;
              }
            }
            nextSnapPoint = nextSnapPoint || width;
          } else {
            // If velocity is negative, find the next snap point to the left
            for (let i = adjustedSnapPoints.length - 1; i >= 0; i--) {
              if (adjustedSnapPoints[i] < xWithVelocity && xWithVelocity - adjustedSnapPoints[i] > width * 0.005) {
                nextSnapPoint = adjustedSnapPoints[i];
                break;
              }
            }
            nextSnapPoint = nextSnapPoint || 0;
          }

          overshoot.value = withSpring(0, sliderConfig);
          runOnJS(onChangeWrapper)(nextSnapPoint / width);

          // Animate to the next snap point
          x.value = withSpring(nextSnapPoint, snappierSpringConfig);

          // if (nextSnapPoint === 0) {
          //   isQuoteStale.value = 0;
          // }
        } else {
          // For low-velocity drags, skip snap points and let the slider rest at current position
          onFinished();
        }
      } else {
        // Use decay animation if no snap points are provided
        x.value = withDecay(
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
    },
  });

  const sliderContainerStyle = useAnimatedStyle(() => {
    const collapsedPercentage = SLIDER_COLLAPSED_HEIGHT / height;

    return {
      height: interpolate(pressProgress.value, [collapsedPercentage, 1], [SLIDER_COLLAPSED_HEIGHT, height]),
      transform: [
        {
          translateX: (overshoot.value ?? 0) * 0.75,
        },
        {
          scaleX: interpolate(pressProgress.value, [collapsedPercentage, 1], [1, 1.025]) + Math.abs(overshoot.value ?? 0) / width,
        },
        {
          scaleY: interpolate(pressProgress.value, [collapsedPercentage, 1], [1, 1.025]) - (Math.abs(overshoot.value ?? 0) / width) * 3,
        },
      ],
    };
  });

  const leftBarContainerStyle = useAnimatedStyle(() => {
    const collapsedPercentage = SLIDER_COLLAPSED_HEIGHT / height;

    return {
      backgroundColor: withSpring(
        interpolateColor(pressProgress.value, [collapsedPercentage, 1], [inactiveColorLeft, activeColorLeft]),
        springConfig
      ),
      borderWidth: interpolate(
        xPercentage.value,
        [0, (THICK_BORDER_WIDTH * 2) / width, (THICK_BORDER_WIDTH * 4) / width, 1],
        [0, 0, THICK_BORDER_WIDTH, THICK_BORDER_WIDTH],
        'clamp'
      ),
      width: `${uiXPercentage.value * 100}%`,
    };
  }, [activeColorLeft, inactiveColorLeft]);

  const rightBarContainerStyle = useAnimatedStyle(() => {
    return {
      borderWidth: interpolate(
        xPercentage.value,
        [0, 1 - (THICK_BORDER_WIDTH * 4) / width, 1 - (THICK_BORDER_WIDTH * 2) / width, 1],
        [THICK_BORDER_WIDTH, THICK_BORDER_WIDTH, 0, 0],
        'clamp'
      ),
      width: `${(1 - uiXPercentage.value - SCRUBBER_WIDTH / width) * 100}%`,
    };
  }, [activeColorRight, inactiveColorRight]);

  const pulsingOpacity = useDerivedValue(() => {
    return isQuoteStale.value === 1
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig);
  }, []);

  const percentageTextStyle = useAnimatedStyle(() => {
    const isAdjustingInputValue = inputMethod.value === 'inputAmount' || inputMethod.value === 'inputNativeValue';
    const isAdjustingOutputValue = inputMethod.value === 'outputAmount' || inputMethod.value === 'outputNativeValue';

    const isStale = isQuoteStale.value === 1 && (isAdjustingInputValue || isAdjustingOutputValue) ? 1 : 0;

    const opacity = isStale ? pulsingOpacity.value : withSpring(1, sliderConfig);

    return {
      color: withTiming(
        interpolateColor(
          isStale,
          [0, 1],
          [(inputMethod.value === 'slider' ? xPercentage.value < 0.005 : x.value === 0) ? zeroAmountColor : labelSecondary, zeroAmountColor]
        ),
        slowFadeConfig
      ),
      opacity,
    };
  });

  return (
    <PanGestureHandler activeOffsetX={[0, 0]} activeOffsetY={[0, 0]} onGestureEvent={onSlide} simultaneousHandlers={[tapRef]}>
      <Animated.View>
        <TapGestureHandler onGestureEvent={onPressDown} simultaneousHandlers={[panRef]}>
          <Animated.View style={{ gap: 14, paddingBottom: 20, paddingHorizontal: 20, paddingTop: 16 }}>
            <View style={{ zIndex: 10 }}>
              <Columns alignHorizontal="justify" alignVertical="center">
                <Inline alignVertical="center" space="6px" wrap={false}>
                  <Bleed vertical="4px">{coinIcon}</Bleed>
                  <Inline alignVertical="bottom" wrap={false}>
                    <Text color={isDarkMode ? 'labelQuaternary' : 'labelTertiary'} size="15pt" style={{ marginRight: 3 }} weight="bold">
                      Selling
                    </Text>
                    <AnimatedText color="labelSecondary" size="15pt" style={percentageTextStyle} text={percentageText} weight="heavy" />
                  </Inline>
                </Inline>
                <Column width="content">
                  <TouchableOpacity
                    activeOpacity={0.4}
                    hitSlop={8}
                    onPress={() => {
                      inputMethod.value = 'slider';
                      isQuoteStale.value = 1;
                      setTimeout(() => {
                        x.value = withSpring(width, snappySpringConfig);
                        onChangeWrapper(1);
                      }, 10);
                    }}
                  >
                    <Text align="center" color={{ custom: bottomColor }} size="15pt" weight="heavy">
                      Max
                    </Text>
                  </TouchableOpacity>
                </Column>
              </Columns>
            </View>
            <Animated.View
              style={[
                sliderContainerStyle,
                {
                  alignItems: 'center',
                  flexDirection: 'row',
                  width,
                },
              ]}
            >
              {/* The slider's left bar */}
              <Animated.View
                style={[
                  styles.sliderBox,
                  {
                    borderColor: separatorSecondary,
                  },
                  leftBarContainerStyle,
                ]}
              />
              {/* The scrubber handle */}
              <Box style={styles.sliderScrubberContainer}>
                <Box
                  style={[
                    styles.sliderScrubber,
                    {
                      backgroundColor: isDarkMode ? globalColors.white100 : globalColors.grey80,
                    },
                  ]}
                />
              </Box>
              {/* The slider's right bar */}
              <Box
                as={Animated.View}
                style={[
                  styles.sliderBox,
                  rightBarContainerStyle,
                  {
                    backgroundColor: inactiveColorRight,
                    // eslint-disable-next-line no-nested-ternary
                    borderColor: dualColor ? separatorSecondary : isDarkMode ? 'rgba(245, 248, 255, 0.015)' : 'rgba(26, 28, 31, 0.005)',
                  },
                ]}
              />
            </Animated.View>
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
    </PanGestureHandler>
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
    height: `${250 / 3}%`, // 83.33%
    width: 4,
  },
  sliderScrubberContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: SCRUBBER_WIDTH,
  },
});
