import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import ShimmerAnimation from '@/components/animations/ShimmerAnimation';
import { BlurGradient } from '@/components/blur/BlurGradient';
import {
  TOAST_DONE_HIDE_TIMEOUT_MS,
  TOAST_GAP_FAR,
  TOAST_GAP_NEAR,
  TOAST_HEIGHT,
  TOAST_HIDE_TIMEOUT_MS,
  TOAST_ICON_SIZE,
  TOAST_INITIAL_OFFSET_ABOVE,
  TOAST_INITIAL_OFFSET_BELOW,
  TOAST_MIN_WIDTH,
  TOAST_TOP_OFFSET,
} from '@/components/rainbow-toast/constants';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import { type RainbowToastWithIndex } from '@/components/rainbow-toast/types';
import { useRainbowToastEnabled } from '@/components/rainbow-toast/useRainbowToastEnabled';
import {
  finishRemoveToast,
  handleTransactions,
  setShowExpandedToasts,
  startRemoveToast,
  useToastStore,
} from '@/components/rainbow-toast/useRainbowToasts';
import { Box, useColorMode, useForegroundColor } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useDimensions } from '@/hooks';
import { useLatestAccountTransactions } from '@/hooks/useAccountTransactions';
import { useMints } from '@/resources/mints';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { time } from '@/utils';
import React, { memo, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
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
import { RainbowTransaction, TransactionStatus } from '@/entities';

const TRANSACTION_RELEVANT_KEYS = ['type', 'status', 'nonce', 'hash', 'chainId'] as const;

function areTransactionsEqual(txs1: RainbowTransaction[], txs2: RainbowTransaction[]): boolean {
  if (txs1 === txs2) return true;
  if (txs1.length !== txs2.length) return false;
  return txs1.every((tx, index) => {
    return TRANSACTION_RELEVANT_KEYS.every(key => tx[key] === txs2[index][key]);
  });
}

function useStableTransactions(transactions: RainbowTransaction[]) {
  const previousTransactions = useRef(transactions);

  if (areTransactionsEqual(previousTransactions.current, transactions)) {
    return previousTransactions.current;
  }

  previousTransactions.current = transactions;
  return transactions;
}

export const RainbowToastDisplay = memo(function RainbowToastDisplay() {
  const rainbowToastsEnabled = useRainbowToastEnabled();

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

  const stableTransactions = useStableTransactions(transactions);
  useEffect(() => {
    handleTransactions({ transactions: stableTransactions, mints });
  }, [mints, stableTransactions]);

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

  const [widths, setWidths] = useState<Record<string, number>>({});

  const minWidth = useMemo(() => {
    return Object.values(widths).reduce((acc, cur) => Math.max(acc, cur), TOAST_MIN_WIDTH);
  }, [widths]);

  const setToastWidth = useCallback((id: string, value: number) => {
    setWidths(prev => {
      return prev[id] !== value
        ? {
            ...prev,
            [id]: value,
          }
        : prev;
    });
  }, []);

  const content = (
    <Box position="absolute" top="0px" left="0px" right="0px" bottom="0px" pointerEvents="box-none">
      <RainbowToastExpandedDisplay />

      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFillObject, hiddenAnimatedStyle]}>
        {visibleToasts.map(toast => {
          return <RainbowToastItem minWidth={minWidth} onWidth={setToastWidth} key={toast.id} toast={toast} />;
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
  minWidth?: number;
  onWidth: (id: string, width: number) => void;
}>;

const RainbowToastItem = memo(function RainbowToast({ toast, testID, minWidth: minWidthProp, onWidth }: Props) {
  const insets = useSafeAreaInsets();
  const { index, id } = toast;

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
  const minWidth = useSharedValue(TOAST_MIN_WIDTH);

  useEffect(() => {
    if (typeof minWidthProp === 'number') {
      minWidth.value = minWidthProp;
    }
  }, [minWidth, minWidthProp]);

  useEffect(() => {
    return () => {
      onWidth(id, 0);
    };
  }, [onWidth, id]);

  useEffect(() => {
    if (!startedHiddenBelow) {
      opacity.value = withSpring(1, springConfig);
      translateY.value = withSpring(distance, springConfig);
    }
  }, [opacity, translateY, distance, startedHiddenBelow]);

  const isRemoving = useRef(false);

  const finishRemoveToastCallback = useCallback(() => {
    finishRemoveToast(id);
  }, [id]);

  const swipeRemoveToastCallback = useCallback(() => {
    isRemoving.current = true;
    onWidth(id, 0);
    startRemoveToast(id, 'swipe');
  }, [onWidth, id]);

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
  const shouldRemoveToast = toast.status !== TransactionStatus.pending;
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
      .onEnd(event => {
        'worklet';
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
      minWidth: withSpring(minWidth.value, SPRING_CONFIGS.snappierSpringConfig),
      transform: [{ scale: withSpring(isPressed.value ? 0.95 : 1) }],
    };
  });

  const contentContainerStyle = useAnimatedStyle(() => {
    return {
      minWidth: withSpring(minWidth.value, SPRING_CONFIGS.snappierSpringConfig),
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

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (!isRemoving.current) {
        onWidth(toast.id, Math.round(e.nativeEvent.layout.width + TOAST_ICON_SIZE + 12));
      }
    },
    [onWidth, toast.id]
  );

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.View style={[dragStyle, { zIndex: 3 - index }]}>
        <Animated.View
          testID={testID}
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
          <View style={[contentContainerStyle, styles.innerContent]}>
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

            {toast.status === TransactionStatus.pending && (
              <ShimmerAnimation color="rgba(255, 255, 255, 0)" gradientColor="rgba(255, 255, 255, 0.08)" animationDuration={2500} />
            )}

            <Animated.View style={innerContainerStyle} onLayout={handleLayout}>
              <ToastContent toast={toast} />
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    alignSelf: 'center',
    position: 'absolute',
    flex: 1,
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
    paddingHorizontal: 20,
    paddingVertical: 8,
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
});
