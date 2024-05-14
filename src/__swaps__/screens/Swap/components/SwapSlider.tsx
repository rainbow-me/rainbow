/* eslint-disable no-nested-ternary */
import React, { useCallback, useRef } from 'react';
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
import { IS_IOS } from '@/env';
import { triggerHapticFeedback } from '@/screens/points/constants';

import {
  SCRUBBER_WIDTH,
  SLIDER_COLLAPSED_HEIGHT,
  SLIDER_HEIGHT,
  SLIDER_WIDTH,
  THICK_BORDER_WIDTH,
  pulsingConfig,
  sliderConfig,
  slowFadeConfig,
  snappierSpringConfig,
  snappySpringConfig,
  springConfig,
} from '@/__swaps__/screens/Swap/constants';
import { clamp, getColorValueForThemeWorklet, opacity, opacityWorklet } from '@/__swaps__/utils/swaps';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';

type SwapSliderProps = {
  dualColor?: boolean;
  height?: number;
  initialPercentage?: number;
  snapPoints?: number[];
  width?: number;
};

export const SwapSlider = ({
  dualColor,
  height = SLIDER_HEIGHT,
  initialPercentage = 0,
  snapPoints = [0, 0.25, 0.5, 0.75, 1], // %
  width = SLIDER_WIDTH,
}: SwapSliderProps) => {
  const { isDarkMode } = useColorMode();
  const {
    AnimatedSwapStyles,
    SwapInputController,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    sliderXPosition,
    sliderPressProgress,
    isQuoteStale,
  } = useSwapContext();

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
      SwapInputController.onChangedPercentage(percentage);
    },
    [SwapInputController]
  );

  const colors = useDerivedValue(() => ({
    inactiveColorLeft: opacityWorklet(
      dualColor
        ? getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.color, isDarkMode, true)
        : getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true),
      0.9
    ),
    activeColorLeft: dualColor
      ? getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.color, isDarkMode, true)
      : getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true),
    inactiveColorRight: dualColor
      ? opacityWorklet(getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true), 0.9)
      : separatorSecondary,
    activeColorRight: dualColor ? getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true) : fillSecondary,
  }));

  // This is the percentage of the slider from the left
  const xPercentage = useDerivedValue(() => {
    return clamp((sliderXPosition.value - SCRUBBER_WIDTH / width) / width, 0, 1);
  }, [sliderXPosition.value]);

  // This is a hacky way to prevent the slider from shifting when it reaches the right limit
  const uiXPercentage = useDerivedValue(() => {
    return xPercentage.value * (1 - SCRUBBER_WIDTH / width);
  }, [xPercentage.value]);

  const percentageText = useDerivedValue(() => {
    return `${Math.round((xPercentage.value ?? initialPercentage) * 100)}%`;
  }, [xPercentage.value]);

  useAnimatedReaction(
    () => ({ x: sliderXPosition.value }),
    (current, previous) => {
      if (current !== previous && SwapInputController.inputMethod.value === 'slider') {
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
      sliderPressProgress.value = withSpring(1, sliderConfig);
      SwapInputController.quoteFetchingInterval.stop();
    },
    onActive: () => {
      sliderPressProgress.value = withSpring(SLIDER_COLLAPSED_HEIGHT / height, sliderConfig);
    },
  });

  const onSlide = useAnimatedGestureHandler({
    onStart: (_, ctx: { startX: number }) => {
      ctx.startX = sliderXPosition.value;
      sliderPressProgress.value = withSpring(1, sliderConfig);
      SwapInputController.inputMethod.value = 'slider';

      // On Android, for some reason waiting until onActive to set SwapInputController.isQuoteStale.value = 1
      // causes the outputAmount text color to break. It's preferable to set it in
      // onActive, so we're setting it in onStart for Android only. It's possible that
      // migrating this handler to the RNGH v2 API will remove the need for this.
      if (!IS_IOS) isQuoteStale.value = 1;
    },
    onActive: (event, ctx: { startX: number }) => {
      if (IS_IOS) isQuoteStale.value = 1;

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
      }

      sliderXPosition.value = clamp(rawX, 0, width);

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
          sliderXPosition.value = withSpring(width, snappySpringConfig);
        } else if (xPercentage.value < 0.005) {
          runOnJS(onChangeWrapper)(0);
          sliderXPosition.value = withSpring(0, snappySpringConfig);
          // SwapInputController.isQuoteStale.value = 0;
        } else {
          runOnJS(onChangeWrapper)(xPercentage.value);
        }
      };

      sliderPressProgress.value = withSpring(SLIDER_COLLAPSED_HEIGHT / height, sliderConfig);

      if (snapPoints) {
        // If snap points are provided and velocity is high enough, snap to the nearest point
        const rawX = ctx.startX + event.translationX || 0;

        // Skip snapping if the slider is already at 0% or 100% and the user is overscrolling
        const needsToSnap =
          !(
            (sliderXPosition.value === 0 && event.velocityX < 0) ||
            (sliderXPosition.value === width && event.velocityX > 0) ||
            (overshoot.value !== 0 && (rawX <= 0 || rawX >= width))
          ) && Math.abs(event.velocityX) > 100; // Skip snapping if velocity is low

        if (needsToSnap) {
          const adjustedSnapPoints = snapPoints.map((point: number) => point * width);
          let nextSnapPoint: number | undefined = undefined;
          const xWithVelocity = sliderXPosition.value;

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
          sliderXPosition.value = withSpring(nextSnapPoint, snappierSpringConfig);

          // if (nextSnapPoint === 0) {
          //   SwapInputController.isQuoteStale.value = 0;
          // }
        } else {
          // For low-velocity drags, skip snap points and let the slider rest at current position
          onFinished();
        }
      } else {
        // Use decay animation if no snap points are provided
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
    },
  });

  const sliderContainerStyle = useAnimatedStyle(() => {
    const collapsedPercentage = SLIDER_COLLAPSED_HEIGHT / height;

    return {
      height: interpolate(sliderPressProgress.value, [collapsedPercentage, 1], [SLIDER_COLLAPSED_HEIGHT, height]),
      transform: [
        {
          translateX: (overshoot.value ?? 0) * 0.75,
        },
        {
          scaleX: interpolate(sliderPressProgress.value, [collapsedPercentage, 1], [1, 1.025]) + Math.abs(overshoot.value ?? 0) / width,
        },
        {
          scaleY:
            interpolate(sliderPressProgress.value, [collapsedPercentage, 1], [1, 1.025]) - (Math.abs(overshoot.value ?? 0) / width) * 3,
        },
      ],
    };
  });

  const leftBarContainerStyle = useAnimatedStyle(() => {
    const collapsedPercentage = SLIDER_COLLAPSED_HEIGHT / height;

    return {
      backgroundColor: withSpring(
        interpolateColor(
          sliderPressProgress.value,
          [collapsedPercentage, 1],
          [colors.value.inactiveColorLeft, colors.value.activeColorLeft]
        ),
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
  });

  const rightBarContainerStyle = useAnimatedStyle(() => {
    return {
      borderWidth: interpolate(
        xPercentage.value,
        [0, 1 - (THICK_BORDER_WIDTH * 4) / width, 1 - (THICK_BORDER_WIDTH * 2) / width, 1],
        [THICK_BORDER_WIDTH, THICK_BORDER_WIDTH, 0, 0],
        'clamp'
      ),
      backgroundColor: colors.value.inactiveColorRight,
      width: `${(1 - uiXPercentage.value - SCRUBBER_WIDTH / width) * 100}%`,
    };
  });

  const pulsingOpacity = useDerivedValue(() => {
    return isQuoteStale.value === 1
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig);
  }, []);

  const percentageTextStyle = useAnimatedStyle(() => {
    const isAdjustingInputValue =
      SwapInputController.inputMethod.value === 'inputAmount' || SwapInputController.inputMethod.value === 'inputNativeValue';
    const isAdjustingOutputValue =
      SwapInputController.inputMethod.value === 'outputAmount' || SwapInputController.inputMethod.value === 'outputNativeValue';

    const isStale = isQuoteStale.value === 1 && (isAdjustingInputValue || isAdjustingOutputValue) ? 1 : 0;

    const opacity = isStale ? pulsingOpacity.value : withSpring(1, sliderConfig);

    return {
      color: withTiming(
        interpolateColor(
          isStale,
          [0, 1],
          [
            (SwapInputController.inputMethod.value === 'slider' ? xPercentage.value < 0.005 : sliderXPosition.value === 0)
              ? zeroAmountColor
              : labelSecondary,
            zeroAmountColor,
          ]
        ),
        slowFadeConfig
      ),
      opacity,
    };
  });

  const maxText = useDerivedValue(() => {
    return 'Max';
  });

  const maxTextColor = useAnimatedStyle(() => {
    return {
      color: getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode),
    };
  });

  return (
    // @ts-expect-error
    <PanGestureHandler activeOffsetX={[0, 0]} activeOffsetY={[0, 0]} onGestureEvent={onSlide} simultaneousHandlers={[tapRef]}>
      <Animated.View style={AnimatedSwapStyles.hideWhileReviewingOrConfiguringGas}>
        {/* @ts-expect-error */}
        <TapGestureHandler onGestureEvent={onPressDown} simultaneousHandlers={[panRef]}>
          <Animated.View style={{ gap: 14, paddingBottom: 20, paddingHorizontal: 20, paddingTop: 16 }}>
            <View style={{ zIndex: 10 }}>
              <Columns alignHorizontal="justify" alignVertical="center">
                <Inline alignVertical="center" space="6px" wrap={false}>
                  <Bleed vertical="4px">
                    {/* TODO: Implement Coin Icons using reanimated values */}
                    <Box
                      as={Animated.View}
                      borderRadius={18}
                      height={{ custom: 16 }}
                      style={[styles.solidColorCoinIcon, AnimatedSwapStyles.assetToBuyIconStyle]}
                      width={{ custom: 16 }}
                    />
                  </Bleed>
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
                      SwapInputController.inputMethod.value = 'slider';
                      isQuoteStale.value = 1;
                      setTimeout(() => {
                        sliderXPosition.value = withSpring(width, snappySpringConfig);
                        onChangeWrapper(1);
                      }, 10);
                    }}
                  >
                    <AnimatedText align="center" style={maxTextColor} size="15pt" weight="heavy" text={maxText} />
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
  solidColorCoinIcon: {
    opacity: 0.4,
  },
});
