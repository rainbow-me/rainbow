/* eslint-disable no-nested-ternary */
import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as i18n from '@/languages';
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
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Bleed, Box, Column, Columns, Inline, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { triggerHapticFeedback } from '@/screens/points/constants';
import { equalWorklet, greaterThanWorklet } from '@/__swaps__/safe-math/SafeMath';
import {
  SCRUBBER_WIDTH,
  SLIDER_COLLAPSED_HEIGHT,
  SLIDER_HEIGHT,
  SLIDER_WIDTH,
  THICK_BORDER_WIDTH,
  pulsingConfig,
} from '@/__swaps__/screens/Swap/constants';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { clamp, getColorValueForThemeWorklet, opacity, opacityWorklet } from '@/__swaps__/utils/swaps';
import { AnimatedSwapCoinIcon } from './AnimatedSwapCoinIcon';
import { GestureHandlerV1Button } from './GestureHandlerV1Button';

type SwapSliderProps = {
  dualColor?: boolean;
  height?: number;
  initialPercentage?: number;
  snapPoints?: number[];
  width?: number;
};

const SWAP_TITLE_LABEL = i18n.t(i18n.l.swap.modal_types.swap);
const BRIDGE_TITLE_LABEL = i18n.t(i18n.l.swap.modal_types.bridge);
const MAX_LABEL = i18n.t(i18n.l.swap.max);

export const SwapSlider = ({
  dualColor,
  height = SLIDER_HEIGHT,
  initialPercentage = 0,
  snapPoints = [0, 0.25, 0.5, 0.75, 1], // 0%, 25%, 50%, 75%, 100%
  width = SLIDER_WIDTH,
}: SwapSliderProps) => {
  const { isDarkMode } = useColorMode();
  const {
    AnimatedSwapStyles,
    SwapInputController,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isFetching,
    isQuoteStale,
    sliderPressProgress,
    sliderXPosition,
    swapInfo,
  } = useSwapContext();

  const panRef = useRef();
  const tapRef = useRef();
  const maxButtonRef = useRef();

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
        ? getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.highContrastColor, isDarkMode, true)
        : getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode, true),
      0.9
    ),
    activeColorLeft: dualColor
      ? getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.highContrastColor, isDarkMode, true)
      : getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode, true),
    inactiveColorRight: dualColor
      ? opacityWorklet(getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode, true), 0.9)
      : separatorSecondary,
    activeColorRight: dualColor
      ? getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode, true)
      : fillSecondary,
  }));

  // This is the percentage of the slider from the left, from 0 to 1
  const xPercentage = useDerivedValue(() => {
    return clamp((sliderXPosition.value - SCRUBBER_WIDTH / width) / width, 0, 1);
  });

  // This is a hacky way to prevent the slider from shifting when it reaches the right limit
  const uiXPercentage = useDerivedValue(() => {
    return xPercentage.value * (1 - SCRUBBER_WIDTH / width);
  });

  const percentageText = useDerivedValue(() => {
    return `${Math.round((xPercentage.value ?? initialPercentage) * 100)}%`;
  });

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
      sliderPressProgress.value = withSpring(1, SPRING_CONFIGS.sliderConfig);
      SwapInputController.quoteFetchingInterval.stop();
    },
    onActive: () => {
      sliderPressProgress.value = withSpring(SLIDER_COLLAPSED_HEIGHT / height, SPRING_CONFIGS.sliderConfig);
    },
  });

  const onSlide = useAnimatedGestureHandler({
    onStart: (_, ctx: { exceedsMax?: boolean; startX: number }) => {
      ctx.exceedsMax = undefined;
      ctx.startX = sliderXPosition.value;
      sliderPressProgress.value = withSpring(1, SPRING_CONFIGS.sliderConfig);
      SwapInputController.inputMethod.value = 'slider';

      if (ctx.startX >= width) {
        const currentInputValue = SwapInputController.inputValues.value.inputAmount;
        const maxSwappableAmount = internalSelectedInputAsset.value?.maxSwappableAmount;
        const exceedsMax = maxSwappableAmount ? greaterThanWorklet(currentInputValue, maxSwappableAmount) : false;

        if (exceedsMax) {
          ctx.exceedsMax = true;
          isQuoteStale.value = 1;
          sliderXPosition.value = width * 0.999;
          runOnJS(triggerHapticFeedback)('impactMedium');
        }
      }

      // On Android, for some reason waiting until onActive to set SwapInputController.isQuoteStale.value = 1 causes
      // the outputAmount text color to break. It's preferable to set it in onActive, so we're setting it in onStart
      // for Android only. It's possible that migrating this handler to the RNGH v2 API will remove the need for this.
      if (!IS_IOS) isQuoteStale.value = 1;
    },
    onActive: (event, ctx: { exceedsMax?: boolean; startX: number }) => {
      if (IS_IOS && sliderXPosition.value > 0 && isQuoteStale.value !== 1) {
        isQuoteStale.value = 1;
      }

      const rawX = ctx.startX + event.translationX || 0;

      const calculateOvershoot = (distance: number, maxOverscroll: number): number => {
        if (distance === 0) return 0;

        const overscrollFraction = Math.min(Math.abs(distance) / maxOverscroll, 1);
        const resistance = 1 / (overscrollFraction * 9 + 1);
        const adjustedMovement = distance * resistance;

        return adjustedMovement;
      };

      if (ctx.startX === width && !ctx.exceedsMax && clamp(rawX, 0, width) >= width * 0.995) {
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
        overshoot.value = withSpring(0, SPRING_CONFIGS.sliderConfig);
        if (xPercentage.value >= 0.995) {
          if (isQuoteStale.value === 1) {
            runOnJS(onChangeWrapper)(1);
          }
          sliderXPosition.value = withSpring(width, SPRING_CONFIGS.snappySpringConfig);
        } else if (xPercentage.value < 0.005) {
          runOnJS(onChangeWrapper)(0);
          sliderXPosition.value = withSpring(0, SPRING_CONFIGS.snappySpringConfig);
          isQuoteStale.value = 0;
          isFetching.value = false;
        } else {
          runOnJS(onChangeWrapper)(xPercentage.value);
        }
      };

      sliderPressProgress.value = withSpring(SLIDER_COLLAPSED_HEIGHT / height, SPRING_CONFIGS.sliderConfig);

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

          overshoot.value = withSpring(0, SPRING_CONFIGS.sliderConfig);
          runOnJS(onChangeWrapper)(nextSnapPoint / width);

          // Animate to the next snap point
          sliderXPosition.value = withSpring(nextSnapPoint, SPRING_CONFIGS.snappierSpringConfig);

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
      backgroundColor: colors.value.inactiveColorRight,
      width: `${(1 - uiXPercentage.value - SCRUBBER_WIDTH / width) * 100}%`,
    };
  });

  const pulsingOpacity = useDerivedValue(() => {
    return isQuoteStale.value === 1
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, SPRING_CONFIGS.sliderConfig);
  });

  const percentageTextStyle = useAnimatedStyle(() => {
    const isAdjustingOutputValue =
      SwapInputController.inputMethod.value === 'outputAmount' || SwapInputController.inputMethod.value === 'outputNativeValue';

    const isStale = isQuoteStale.value === 1 && isAdjustingOutputValue ? 1 : 0;
    const opacity = isStale ? pulsingOpacity.value : withSpring(1, SPRING_CONFIGS.sliderConfig);

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
        TIMING_CONFIGS.slowFadeConfig
      ),
      opacity,
    };
  });

  const sellingOrBridgingLabel = useDerivedValue(() => {
    return swapInfo.value.isBridging ? BRIDGE_TITLE_LABEL : SWAP_TITLE_LABEL;
  });

  const maxTextColor = useAnimatedStyle(() => {
    return {
      color: getColorValueForThemeWorklet(internalSelectedInputAsset.value?.highContrastColor, isDarkMode),
    };
  });

  return (
    // @ts-expect-error Property 'children' does not exist on type
    <PanGestureHandler activeOffsetX={[0, 0]} activeOffsetY={[0, 0]} onGestureEvent={onSlide} simultaneousHandlers={[tapRef]}>
      <Animated.View style={AnimatedSwapStyles.hideWhileReviewingOrConfiguringGas}>
        {/* @ts-expect-error Property 'children' does not exist on type */}
        <TapGestureHandler onGestureEvent={onPressDown} simultaneousHandlers={[maxButtonRef, panRef]}>
          <Animated.View style={{ gap: 14, paddingBottom: 20, paddingHorizontal: 20 }}>
            <View style={{ zIndex: 10 }}>
              <Columns alignHorizontal="justify" alignVertical="center">
                <Inline alignVertical="center" space="6px" wrap={false}>
                  <Bleed vertical="4px">
                    <AnimatedSwapCoinIcon showBadge={false} assetType={'input'} small />
                  </Bleed>
                  <Inline alignVertical="bottom" wrap={false}>
                    <AnimatedText
                      color={isDarkMode ? 'labelQuaternary' : 'labelTertiary'}
                      size="15pt"
                      style={{ marginRight: 3 }}
                      weight="bold"
                    >
                      {sellingOrBridgingLabel}
                    </AnimatedText>
                    <AnimatedText color="labelSecondary" size="15pt" style={percentageTextStyle} weight="heavy">
                      {percentageText}
                    </AnimatedText>
                  </Inline>
                </Inline>
                <Column width="content">
                  <GestureHandlerV1Button
                    onPressWorklet={() => {
                      'worklet';
                      SwapInputController.inputMethod.value = 'slider';

                      const currentInputValue = SwapInputController.inputValues.value.inputAmount;
                      const maxSwappableAmount = internalSelectedInputAsset.value?.maxSwappableAmount;

                      const isAlreadyMax = maxSwappableAmount ? equalWorklet(currentInputValue, maxSwappableAmount) : false;
                      const exceedsMax = maxSwappableAmount ? greaterThanWorklet(currentInputValue, maxSwappableAmount) : false;

                      if (isAlreadyMax) {
                        runOnJS(triggerHapticFeedback)('impactMedium');
                      } else {
                        SwapInputController.quoteFetchingInterval.stop();
                        if (exceedsMax) sliderXPosition.value = width * 0.999;

                        sliderXPosition.value = withSpring(width, SPRING_CONFIGS.snappySpringConfig, isFinished => {
                          if (isFinished) {
                            runOnJS(onChangeWrapper)(1);
                          }
                        });
                      }
                    }}
                    style={{ margin: -12, padding: 12 }}
                    ref={maxButtonRef}
                  >
                    <AnimatedText align="center" size="15pt" style={maxTextColor} weight="heavy">
                      {MAX_LABEL}
                    </AnimatedText>
                  </GestureHandlerV1Button>
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
});
