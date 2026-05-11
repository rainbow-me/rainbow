import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { createDerivedStore } from '@storesjs/stores';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import ShimmerAnimation from '@/components/animations/ShimmerAnimation';
import { BlurGradient } from '@/components/blur/BlurGradient';
import {
  TOAST_CONTENT_PADDING_LEFT,
  TOAST_CONTENT_PADDING_RIGHT,
  TOAST_GAP_FAR,
  TOAST_GAP_NEAR,
  TOAST_HEIGHT,
  TOAST_INITIAL_OFFSET_ABOVE,
  TOAST_INITIAL_OFFSET_BELOW,
  TOAST_TOP_OFFSET,
} from '@/components/rainbow-toast/constants';
import {
  areToastContentLayoutsEqual,
  buildToastContentLayout,
  measureToastContentWidth,
  ToastContent,
  type ToastContentLayout,
} from '@/components/rainbow-toast/ToastContent';
import { type RainbowToast } from '@/components/rainbow-toast/types';
import { useRainbowToastEnabled } from '@/components/rainbow-toast/useRainbowToastEnabled';
import {
  getTopRainbowToast,
  rainbowToastsActions,
  useRainbowToasts,
  useRainbowToastsStore,
  type ToastState,
} from '@/components/rainbow-toast/useRainbowToastsStore';
import { Box, useColorMode, useForegroundColor } from '@/design-system';
import { TransactionStatus } from '@/entities/transactions';
import { IS_ANDROID, IS_IOS, IS_TEST } from '@/env';
import useAccountSettings from '@/hooks/useAccountSettings';
import useDimensions from '@/hooks/useDimensions';
import { useListen } from '@/state/internal/hooks/useListen';
import { useStoreSharedValue, type ReadOnlySharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { RainbowToastExpandedDisplay } from './RainbowToastExpandedDisplay';
import { useVerticalDismissPanGesture } from './useVerticalDismissPanGesture';

export const RainbowToastDisplay = memo(function RainbowToastDisplay() {
  const rainbowToastsEnabled = useRainbowToastEnabled();
  const { language } = useAccountSettings();

  if (!rainbowToastsEnabled) {
    return null;
  }

  return <RainbowToastDisplayContent key={language} />;
});

/**
 * Returns the toasts with their index adjusted by not counting the ones being removed.
 */
function toastsWithAdjustedIndex(toasts: RainbowToast[]): [RainbowToast, number][] {
  let currentIndex = 0;
  return toasts.map(toast => {
    const index = currentIndex;
    if (!toast.isRemoving) {
      currentIndex += 1;
    }
    return [toast, index];
  });
}

function RainbowToastDisplayContent() {
  const isShowingTransactionDetails = useRainbowToastsStore(state => state.isShowingTransactionDetails);
  const toasts = useRainbowToasts();
  const { height: deviceHeight } = useDimensions();

  const stackWidth = useStoreSharedValue(useToastStackWidth, width => width);
  const showingTransactionDetails = useSharedValue(false);

  useEffect(() => {
    showingTransactionDetails.value = isShowingTransactionDetails;
  }, [isShowingTransactionDetails, showingTransactionDetails]);

  const { dragY, panGesture, isDismissed } = useVerticalDismissPanGesture({
    onDismiss: rainbowToastsActions.removeAllToasts,
    height: deviceHeight,
    dismissSensitivity: 0.5,
    dismissTargetY: -100,
  });

  const hiddenAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(isDismissed.value || showingTransactionDetails.value ? 0 : 1, springConfig),
      transform: [{ translateY: dragY.value }],
    };
  });

  // Dismiss all toasts when changing account.
  useListen(useWalletsStore, s => s.accountAddress, rainbowToastsActions.removeAllToasts);

  // show all removing and 3 latest toasts
  const visibleToasts = useMemo(() => {
    const toastsToShow: RainbowToast[] = [];
    const removingToasts: RainbowToast[] = [];
    for (const toast of toasts) {
      if (toast.isRemoving) {
        removingToasts.push(toast);
      } else {
        toastsToShow.push(toast);
        // show 3 toasts + 1 extra hidden off to the bottom
        if (toastsToShow.length > 3) {
          break;
        }
      }
    }

    return [...removingToasts, ...toastsToShow];
  }, [toasts]);

  const content = (
    <Box position="absolute" top="0px" left="0px" right="0px" bottom="0px" pointerEvents="box-none">
      <RainbowToastExpandedDisplay />

      <GestureDetector gesture={panGesture}>
        <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFillObject, hiddenAnimatedStyle]}>
          {toastsWithAdjustedIndex(visibleToasts).map(([toast, index]) => {
            return <RainbowToastItem stackWidth={stackWidth} key={toast.id} toast={toast} index={index} />;
          })}
        </Animated.View>
      </GestureDetector>
    </Box>
  );

  // FullWindowOverlay blocks all views for maestro.
  if (IS_IOS && !IS_TEST) {
    return <FullWindowOverlay>{content}</FullWindowOverlay>;
  }

  return content;
}

const springConfig: WithSpringConfig = {
  damping: 14,
  mass: 1,
  overshootClamping: false,
  stiffness: 121.6,
};

const DISMISS_THRESHOLD_PERCENTAGE = 0.1;
const DISMISS_VELOCITY_THRESHOLD = 80;

const useToastStackWidth = createDerivedStore(
  $ => {
    const layout = $(useRainbowToastsStore, selectTopToastContentLayout, areToastContentLayoutsEqual);
    if (!layout) return 0;
    return measureToastContentWidth(layout) + TOAST_CONTENT_PADDING_LEFT + TOAST_CONTENT_PADDING_RIGHT;
  },
  { lockDependencies: true }
);

function selectTopToastContentLayout(state: ToastState): ToastContentLayout | null {
  const topToast = getTopRainbowToast(state.toasts);
  if (!topToast) return null;
  return buildToastContentLayout(topToast);
}

type Props = {
  toast: RainbowToast;
  stackWidth: ReadOnlySharedValue<number>;
  index: number;
};

const RainbowToastItem = memo(function RainbowToast({ toast, stackWidth, index }: Props) {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();

  const id = toast.id;
  const gap = index > 1 ? TOAST_GAP_FAR : TOAST_GAP_NEAR;
  const distance = index * gap + insets.top + TOAST_TOP_OFFSET;
  const startedHiddenBelow = index > 2;

  const isPressed = useSharedValue(false);
  const lastChangeX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(startedHiddenBelow ? distance + TOAST_INITIAL_OFFSET_BELOW : insets.top + TOAST_INITIAL_OFFSET_ABOVE);

  useEffect(() => {
    if (!startedHiddenBelow) {
      opacity.value = withSpring(1, springConfig);
      translateY.value = withSpring(distance, springConfig);
    }
  }, [opacity, translateY, distance, startedHiddenBelow]);

  const finishRemoveToastCallback = useCallback(() => {
    rainbowToastsActions.finishRemoveToast(id);
  }, [id]);

  const swipeRemoveToastCallback = useCallback(() => {
    rainbowToastsActions.startRemoveToast(id, 'swipe');
  }, [id]);

  const hideToast = useCallback(() => {
    opacity.value = withSpring(0, springConfig, () => {
      runOnJS(finishRemoveToastCallback)();
    });
    translateY.value = withSpring(translateY.value - 10, springConfig);
  }, [finishRemoveToastCallback, translateY, opacity]);

  useEffect(() => {
    if (toast.removalReason === 'finish') {
      hideToast();
    }
  }, [hideToast, toast.removalReason]);

  const panGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .minDistance(10)
      .activeOffsetX([-10, 10])
      .failOffsetY([-10, 10])
      .onUpdate(event => {
        translateX.value = event.translationX;
      })
      .onEnd(event => {
        const velocityX = event.velocityX;
        lastChangeX.value = 0;

        const dismissThreshold = deviceWidth * DISMISS_THRESHOLD_PERCENTAGE;
        const isDraggedFarEnough = Math.abs(event.translationX) > dismissThreshold;
        const isDraggedFastEnough = Math.abs(velocityX) >= DISMISS_VELOCITY_THRESHOLD;

        if (isDraggedFarEnough && isDraggedFastEnough) {
          runOnJS(swipeRemoveToastCallback)();
          const toValue = event.translationX > 0 ? deviceWidth : -deviceWidth;
          translateX.value = withSpring(
            toValue,
            {
              damping: 35,
              stiffness: 150,
            },
            finished => {
              if (finished) {
                runOnJS(finishRemoveToastCallback)();
              }
            }
          );
        } else {
          translateX.value = withSpring(0, springConfig);
          isPressed.value = false;
        }
      });

    return pan;
  }, [translateX, lastChangeX, deviceWidth, swipeRemoveToastCallback, finishRemoveToastCallback, isPressed]);

  const dragStyle = useAnimatedStyle(() => {
    const opacityY = opacity.value;
    const opacityX = interpolate(Math.abs(translateX.value), [0, deviceWidth / 2], [1, 0], 'clamp');
    const scale = interpolate(index, [0, 2], [1, 0.95], 'clamp');

    return {
      opacity: opacityY * opacityX,
      transform: [{ translateY: translateY.value }, { translateX: translateX.value }, { scale }],
    };
  });

  const setShowExpandedTrue = useCallback(() => {
    isPressed.value = false;
    rainbowToastsActions.setShowExpandedToasts(true);
  }, [isPressed]);

  const pressGesture = useMemo(() => {
    return Gesture.Tap()
      .maxDeltaX(5)
      .maxDeltaY(5)
      .maxDuration(2000)
      .onTouchesDown(() => {
        isPressed.value = true;
      })
      .onStart(() => {
        runOnJS(setShowExpandedTrue)();
      })
      .onFinalize(() => {
        isPressed.value = false;
      });
  }, [isPressed, setShowExpandedTrue]);

  const combinedGesture = useMemo(() => {
    return Gesture.Simultaneous(pressGesture, panGesture);
  }, [pressGesture, panGesture]);

  const outerContainerStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(stackWidth.value, SPRING_CONFIGS.snappierSpringConfig),
      transform: [{ scale: withSpring(isPressed.value ? 0.95 : 1) }],
    };
  });

  const contentContainerStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(stackWidth.value, SPRING_CONFIGS.snappierSpringConfig),
    };
  });

  const innerContainerStyle = useAnimatedStyle(() => {
    const stackOpacity = interpolate(index, [0, 2], [1, 0.8], 'clamp') * interpolate(index, [2, 3], [1, 0], 'clamp');
    const pressOpacity = isPressed.value ? 0.6 : 0.9;

    return {
      opacity: withTiming(pressOpacity * stackOpacity),
    };
  });

  const shadowOpacity = interpolate(index, [0, 2], [0.45, 0.2], 'clamp');
  const borderDark = useForegroundColor('separatorSecondary');

  return (
    <Animated.View pointerEvents="box-none" style={[styles.outerGestureView, dragStyle, { zIndex: 3 - index }]}>
      <GestureDetector gesture={combinedGesture}>
        <Animated.View
          testID={`toast-${toast.id}`}
          style={[
            styles.outerContainer,
            outerContainerStyle,
            {
              shadowRadius: interpolate(index, [0, 2], [8, 2], 'clamp'),
              shadowOpacity,
              shadowColor: `rgba(0,0,0,${shadowOpacity})`,
              shadowOffset: { height: interpolate(index, [0, 2], [4, 1], 'clamp'), width: 0 },
            },
          ]}
        >
          {/* separate background to avoid being blurred by blurview */}
          <View
            style={[
              styles.background,
              {
                borderColor: isDarkMode ? borderDark : IS_ANDROID ? 'rgba(150,150,150,0.5)' : 'rgba(255, 255, 255, 0.72)',
              },
            ]}
          />

          {/* separate inner view because overflow hidden + shadow breaks */}
          <Animated.View style={[contentContainerStyle, styles.innerContent]}>
            {IS_IOS ? (
              <>
                <BlurGradient
                  gradientPoints={[
                    { x: 0.5, y: 1.2 },
                    { x: 0.5, y: 0 },
                  ]}
                  height={TOAST_HEIGHT + 5}
                  intensity={16}
                  saturation={1.5}
                  style={StyleSheet.absoluteFill}
                  width={deviceWidth}
                />
                <LinearGradient
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  colors={
                    isDarkMode
                      ? ['rgba(57, 58, 64, 0.36)', 'rgba(57, 58, 64, 0.32)']
                      : ['rgba(255, 255, 255, 0.72)', 'rgba(255, 255, 255, 0.54)']
                  }
                  style={StyleSheet.absoluteFill}
                />
              </>
            ) : (
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? 'rgba(40,40,40,0.985)' : 'rgba(255,255,255,0.985)' }]}
              />
            )}

            {isDarkMode && (
              <LinearGradient
                end={{ x: 0.5, y: 1 }}
                colors={['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0)']}
                start={{ x: 0.5, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            )}

            {toast.transaction.status === TransactionStatus.pending && (
              <ShimmerAnimation color="rgba(255, 255, 255, 0)" gradientColor="rgba(255, 255, 255, 0.08)" animationDuration={2500} />
            )}

            <Animated.View style={innerContainerStyle}>
              <ToastContent toast={toast} />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  outerGestureView: {
    alignSelf: 'center',
    // Maestro cannot detect views that overflow their parent, so
    // avoid stacking toasts in test.
    minHeight: IS_TEST ? TOAST_HEIGHT : 0,
  },
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    alignSelf: 'center',
    position: IS_TEST ? 'relative' : 'absolute',
    minHeight: TOAST_HEIGHT,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
    borderWidth: 1,
    flex: 1,
    zIndex: 1000000,
  },
  innerContent: {
    overflow: 'hidden',
    paddingLeft: TOAST_CONTENT_PADDING_LEFT,
    paddingRight: TOAST_CONTENT_PADDING_RIGHT,
    paddingVertical: 8,
    flex: 1,
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderRadius: 100,
  },
});
