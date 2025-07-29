import { BlurGradient } from '@/components/blur/BlurGradient';
import {
  doneTransactionStatuses,
  TOAST_DONE_HIDE_TIMEOUT_MS,
  TOAST_GAP_FAR,
  TOAST_GAP_NEAR,
  TOAST_HEIGHT,
  TOAST_HIDE_TIMEOUT_MS,
  TOAST_INITIAL_OFFSET_ABOVE,
  TOAST_INITIAL_OFFSET_BELOW,
  TOAST_TOP_OFFSET,
} from '@/components/rainbow-toast/constants';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import { type RainbowToastWithIndex } from '@/components/rainbow-toast/types';
import {
  finishRemoveToast,
  handleTransactions,
  setShowExpandedToasts,
  startRemoveToast,
  useToastStore,
} from '@/components/rainbow-toast/useRainbowToasts';
import { RAINBOW_TOASTS, useExperimentalFlag } from '@/config';
import { Box, useColorMode } from '@/design-system';
import { TransactionStatus } from '@/entities';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useDimensions } from '@/hooks';
import { useLatestAccountTransactions } from '@/hooks/useAccountTransactions';
import { useMints } from '@/resources/mints';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { time } from '@/utils';
import React, { memo, PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { RainbowToastExpandedDisplay } from './RainbowToastExpandedDisplay';

export const RainbowToastDisplay = memo(function RainbowToastDisplay() {
  const rainbowToastsEnabled = useExperimentalFlag(RAINBOW_TOASTS);

  if (!rainbowToastsEnabled) {
    return null;
  }

  return <RainbowToastDisplayContent />;
});

function RainbowToastDisplayContent() {
  const { toasts, isShowingTransactionDetails } = useToastStore();
  const { transactions } = useLatestAccountTransactions();

  const showingTransactionDetails = useSharedValue(false);

  useEffect(() => {
    showingTransactionDetails.value = isShowingTransactionDetails;
  }, [isShowingTransactionDetails, showingTransactionDetails]);

  const hiddenAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(showingTransactionDetails.value ? 0 : 1, springConfig),
    };
  });

  const accountAddress = useAccountAddress();
  const {
    data: { mints },
  } = useMints({
    walletAddress: accountAddress,
  });

  useEffect(() => {
    handleTransactions({ transactions, mints });
  }, [mints, transactions]);

  // show all removing and 3 latest toasts
  const visibleToasts = useMemo(() => {
    const toastsToShow: RainbowToastWithIndex[] = [];
    const removingToasts: RainbowToastWithIndex[] = [];
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

  const hasWideToast = visibleToasts.some(
    t => t.type === 'swap' && (t.status === TransactionStatus.swapping || t.status === TransactionStatus.pending)
  );

  const content = (
    <Box position="absolute" top="0px" left="0px" right="0px" bottom="0px" pointerEvents="box-none">
      <RainbowToastExpandedDisplay />

      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFillObject, hiddenAnimatedStyle]}>
        {visibleToasts.map(toast => {
          return <RainbowToastItem hasWideToast={hasWideToast} key={toast.id} toast={toast} />;
        })}
      </Animated.View>
    </Box>
  );

  if (IS_IOS) {
    return <FullWindowOverlay>{content}</FullWindowOverlay>;
  }

  return content;
}

const springConfig: WithSpringConfig = {
  damping: 14,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 121.6,
};

const DISMISS_THRESHOLD_PERCENTAGE = 0.1;
const DISMISS_VELOCITY_THRESHOLD = 80;

type Props = PropsWithChildren<{
  testID?: string;
  toast: RainbowToastWithIndex;
  hasWideToast: boolean;
}>;

const RainbowToastItem = memo(function RainbowToast({ toast, testID, hasWideToast }: Props) {
  const insets = useSafeAreaInsets();
  const { index, id } = toast;

  const height = TOAST_HEIGHT;
  const gap = index > 1 ? TOAST_GAP_FAR : TOAST_GAP_NEAR;
  const distance = index * gap + insets.top + TOAST_TOP_OFFSET;
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const startedHiddenBelow = index > 2;
  const translateY = useSharedValue(
    (() => {
      if (startedHiddenBelow) {
        // if >3 (starting hidden), start from below
        return distance + TOAST_INITIAL_OFFSET_BELOW;
      } else {
        return insets.top + TOAST_INITIAL_OFFSET_ABOVE;
      }
    })()
  );
  const lastChangeX = useSharedValue(0);
  const isPressed = useSharedValue(false);
  const touchStartedAt = useSharedValue(0);
  const isSimulator = useSharedValue(false);
  const isWide = useSharedValue(hasWideToast);

  useEffect(() => {
    isWide.value = hasWideToast;
  }, [isWide, hasWideToast]);

  useEffect(() => {
    DeviceInfo.isEmulator().then(result => {
      isSimulator.value = result;
    });
  }, [isSimulator]);

  useEffect(() => {
    if (!startedHiddenBelow) {
      opacity.value = withSpring(1, springConfig);
      translateY.value = withSpring(distance, springConfig);
    }
  }, [opacity, translateY, distance, startedHiddenBelow]);

  const finishRemoveToastCallback = useCallback(() => {
    finishRemoveToast(id);
  }, [id]);

  const swipeRemoveToastCallback = useCallback(() => {
    startRemoveToast(id, 'swipe');
  }, [id]);

  const hideToast = useCallback(() => {
    'worklet';
    opacity.value = withSpring(0, springConfig, () => {
      runOnJS(finishRemoveToastCallback)();
    });
    translateY.value = withSpring(translateY.value - 10, springConfig);
  }, [finishRemoveToastCallback, translateY, opacity]);

  // there's a few ways to remove toasts - from a swipe, from it being removed
  // via pendingTransactions, or if it reaches final state if
  // pendingTransactions are empty we set removing in state, so handle the final
  // logic to hide it here
  const nonSwipeRemove = toast.isRemoving && !toast.removalReason;
  useEffect(() => {
    if (nonSwipeRemove) {
      hideToast();
    }
  }, [finishRemoveToastCallback, hideToast, nonSwipeRemove, translateY, opacity]);

  // hide toast - we always hide it eventually, just slower if not in a finished state
  // disable while testing
  const shouldRemoveToast = toast.status in doneTransactionStatuses;
  useEffect(() => {
    // if removing already and not from us
    if (toast.isRemoving && !toast.removalReason) return;

    // if not already removing set timeout to remove
    if (!toast.isRemoving) {
      const tm = setTimeout(
        () => {
          // sets it into removing state so it wont be cleared on other state updates
          startRemoveToast(id, 'finish');
        },
        shouldRemoveToast ? TOAST_DONE_HIDE_TIMEOUT_MS : TOAST_HIDE_TIMEOUT_MS
      );

      return () => {
        clearTimeout(tm);
      };
    }

    if (toast.removalReason === 'finish') {
      hideToast();
    }
  }, [hideToast, id, shouldRemoveToast, toast]);

  const panGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .minDistance(10)
      .onUpdate(event => {
        'worklet';
        translateX.value = event.translationX;
      })
      .onChange(event => {
        'worklet';
        // on iOS simulator velocityX is always 0 so using changeX as workaround
        if (IS_IOS && isSimulator.value) {
          lastChangeX.value = event.changeX;
        }
      })
      .onEnd(event => {
        'worklet';
        const velocityX = IS_IOS && isSimulator.value ? lastChangeX.value : event.velocityX;
        lastChangeX.value = 0;

        const dismissThreshold = deviceWidth * DISMISS_THRESHOLD_PERCENTAGE;
        const isDraggedFarEnough = Math.abs(event.translationX) > dismissThreshold;
        const isDraggedFastEnough =
          Math.abs(velocityX) >=
          // on emulator velocity is always far less, without this you can't swipe to dismiss
          (isSimulator.value ? 5 : DISMISS_VELOCITY_THRESHOLD);

        if (isDraggedFarEnough && isDraggedFastEnough) {
          runOnJS(swipeRemoveToastCallback)();
          const toValue = event.translationX > 0 ? deviceWidth : -deviceWidth;
          translateX.value = withSpring(
            toValue,
            {
              damping: 35,
              stiffness: 150,
              // avoid it bouncing a lot at the "end" so it removes on time
              restDisplacementThreshold: 0.5,
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
  }, [translateX, isSimulator.value, lastChangeX, deviceWidth, swipeRemoveToastCallback, finishRemoveToastCallback, isPressed]);

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
    setShowExpandedToasts(true);
  }, [isPressed]);

  const pressGesture = useMemo(() => {
    const maxPressDuration = 2000;

    function doPress() {
      'worklet';
      if (Date.now() - touchStartedAt.value < maxPressDuration) {
        runOnJS(setShowExpandedTrue)();
      }
    }

    return Gesture.Tap()
      .maxDuration(time.minutes(10)) // doesn't accept Infinity
      .onTouchesDown(() => {
        'worklet';
        touchStartedAt.value = Date.now();
        isPressed.value = true;
      })
      .onTouchesUp(() => {
        'worklet';
        // android doesn't trigger onEnd, do our own logic
        if (IS_ANDROID && translateX.value === 0) {
          doPress();
        }

        isPressed.value = false;
      })
      .onEnd(() => {
        'worklet';
        doPress();
      });
  }, [isPressed, setShowExpandedTrue, touchStartedAt, translateX.value]);

  const combinedGesture = useMemo(() => {
    return Gesture.Simultaneous(pressGesture, panGesture);
  }, [pressGesture, panGesture]);

  const outerContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isPressed.value ? 0.95 : 1) }],
    };
  });

  const innerContainerStyle = useAnimatedStyle(() => {
    const stackOpacity = interpolate(index, [0, 2], [1, 0.8], 'clamp') * interpolate(index, [2, 3], [1, 0], 'clamp');
    const pressOpacity = isPressed.value ? 0.6 : 0.9;

    return {
      minWidth: withTiming(isWide.value ? 170 : 130),
      opacity: withTiming(pressOpacity * stackOpacity),
    };
  });

  const shadowOpacity = interpolate(index, [0, 2], [0.45, 0.2], 'clamp');

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.View style={[dragStyle, { zIndex: 3 - index }]}>
        <Animated.View
          style={[
            styles.shadowContainer,
            {
              shadowRadius: interpolate(index, [0, 2], [8, 2], 'clamp'),
              shadowOpacity,
              shadowColor: `rgba(0,0,0,${shadowOpacity})`,
              shadowOffset: { height: interpolate(index, [0, 2], [4, 1], 'clamp'), width: 0 },
            },
            outerContainerStyle,
          ]}
        >
          <Box
            borderRadius={100}
            paddingVertical="8px"
            paddingHorizontal="20px"
            pointerEvents="auto"
            position="absolute"
            height={52}
            alignItems="center"
            justifyContent="center"
            top="0px"
            borderColor={isDarkMode ? 'separatorSecondary' : { custom: IS_ANDROID ? 'rgba(150,150,150,0.5)' : 'rgba(255, 255, 255, 0.72)' }}
            testID={testID}
          >
            {IS_IOS ? (
              <>
                <BlurGradient
                  gradientPoints={[
                    { x: 0.5, y: 1.2 },
                    { x: 0.5, y: 0 },
                  ]}
                  height={height}
                  intensity={16}
                  saturation={1.5}
                  style={StyleSheet.absoluteFill}
                  width={450}
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

            <Animated.View style={innerContainerStyle}>
              <ToastContent toast={toast} />
            </Animated.View>
          </Box>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  shadowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
