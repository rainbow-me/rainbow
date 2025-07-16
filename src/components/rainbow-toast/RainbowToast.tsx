import { BlurGradient } from '@/components/blur/BlurGradient';
import { MintToastContent } from '@/components/rainbow-toast/MintToastContent';
import { SendToastContent } from '@/components/rainbow-toast/SendToastContent';
import { SwapToastContent } from '@/components/rainbow-toast/SwapToastContent';
import { type RainbowToastWithIndex } from '@/components/rainbow-toast/types';
import {
  finishRemoveToast,
  handleTransactions,
  setShowExpandedToasts,
  startRemoveToast,
  useToastStore,
} from '@/components/rainbow-toast/useRainbowToasts';
import { PANEL_COLOR_DARK } from '@/components/SmoothPager/ListPanel';
import { Box, globalColors, useColorMode } from '@/design-system';
import { TransactionStatus } from '@/entities';
import { IS_IOS } from '@/env';
import { useDimensions } from '@/hooks';
import usePendingTransactions from '@/hooks/usePendingTransactions';
import { useMints } from '@/resources/mints';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import React, { memo, PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { RainbowToastExpandedDisplay } from './RainbowToastExpandedDisplay';

export function RainbowToastDisplay() {
  const { toasts, isShowingTransactionDetails } = useToastStore();
  const insets = useSafeAreaInsets();
  const { pendingTransactions } = usePendingTransactions();

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
    handleTransactions({ pendingTransactions, mints });
  }, [mints, pendingTransactions]);

  // show all removing and 3 latest toasts
  const toastsToShow: RainbowToastWithIndex[] = [];
  const removingToasts: RainbowToastWithIndex[] = [];
  for (const toast of toasts) {
    if (toast.removing) {
      removingToasts.push(toast);
    } else {
      if (toastsToShow.length > 2) {
        break;
      }
      toastsToShow.push(toast);
    }
  }

  const visibleToasts = [...removingToasts, ...toastsToShow];

  return (
    <FullWindowOverlay>
      <Box position="absolute" top="0px" left="0px" right="0px" bottom="0px" pointerEvents="box-none">
        <RainbowToastExpandedDisplay insets={insets} />

        <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFillObject, hiddenAnimatedStyle]}>
          {visibleToasts.map(toast => {
            return <RainbowToastItem insets={insets} key={toast.id} toast={toast} />;
          })}
        </Animated.View>
      </Box>
    </FullWindowOverlay>
  );
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
const DISMISS_VELOCITY_THRESHOLD = 5;

type Props = PropsWithChildren<{
  testID?: string;
  toast: RainbowToastWithIndex;
  insets: EdgeInsets;
}>;

const RainbowToastItem = memo(function RainbowToast({ toast, testID, insets }: Props) {
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();
  const visible = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lastChangeX = useSharedValue(0);

  const height = 60;
  const { index, id } = toast;
  const gap = 5;
  const distance = index * gap + insets.top + 8;

  useEffect(() => {
    visible.value = withSpring(1, springConfig);

    if (translateY.value === 0) {
      if (index === 0) {
        // first toast starts from above
        translateY.value = insets.top - 80;
      } else if (index === 2) {
        // bottom toast start from below
        translateY.value = distance + 2;
      } else {
        // middle toast starts at target position
        translateY.value = distance;
      }
    }
  }, [visible, translateY, distance, index, insets.top]);

  useEffect(() => {
    translateY.value = withSpring(distance, springConfig);
  }, [distance, translateY]);

  const finishRemoveToastCallback = useCallback(() => {
    finishRemoveToast(id);
  }, [id]);

  const swipeRemoveToastCallback = useCallback(() => {
    startRemoveToast(id, 'swipe');
  }, [id]);

  const hideToast = useCallback(() => {
    visible.value = withSpring(0, springConfig, () => {
      runOnJS(finishRemoveToastCallback)();
    });
    translateY.value = withSpring(translateY.value - 10, springConfig);
  }, [finishRemoveToastCallback, translateY, visible]);

  // there's a few ways to remove toasts - from a swipe, from it being removed
  // via pendingTransactions for swipe, or if it reaches final state
  // we handle the non-swipe states here
  const nonSwipeRemove = toast.removing === true;
  useEffect(() => {
    if (nonSwipeRemove) {
      hideToast();
    }
  }, [finishRemoveToastCallback, hideToast, nonSwipeRemove, translateY, visible]);

  // if we reach a finished state we set a timeout and then remove
  const shouldHideItself =
    (toast.type === 'swap' && toast.status === TransactionStatus.swapped) ||
    (toast.type === 'send' && toast.status === TransactionStatus.sent) ||
    (toast.type === 'mint' && toast.status === TransactionStatus.minted);

  useEffect(() => {
    if (!shouldHideItself) return;
    if (toast.removing === true) return;

    if (!toast.removing) {
      // sets it into removing state so it wont be cleared on other state updates
      startRemoveToast(id, 'finish');
      return;
    }

    if (toast.removing === 'finish') {
      const tm = setTimeout(() => {
        hideToast();
        // wait a few seconds
      }, 3000);

      return () => {
        clearTimeout(tm);
      };
    }
  }, [hideToast, id, shouldHideItself, toast]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .minDistance(10)
      .onUpdate(event => {
        translateX.value = event.translationX;
      })
      .onChange(event => {
        // at least on iOS simulator velocityX is always 0 so using this
        lastChangeX.value = event.changeX;
      })
      .onEnd(event => {
        const velocityX = lastChangeX.value;
        lastChangeX.value = 0;

        const dismissThreshold = deviceWidth * DISMISS_THRESHOLD_PERCENTAGE;
        const isDraggedFarEnough = Math.abs(event.translationX) > dismissThreshold;
        const isDraggedFastEnough = Math.abs(velocityX) >= DISMISS_VELOCITY_THRESHOLD;

        if (isDraggedFarEnough && isDraggedFastEnough) {
          runOnJS(swipeRemoveToastCallback)();
          const toValue = event.translationX > 0 ? deviceWidth : -deviceWidth;
          translateX.value = withSpring(toValue, { damping: 20, stiffness: 90 }, finished => {
            if (finished) {
              runOnJS(finishRemoveToastCallback)();
            }
          });
        } else {
          translateX.value = withSpring(0, springConfig);
        }
      });
  }, [translateX, lastChangeX, deviceWidth, swipeRemoveToastCallback, finishRemoveToastCallback]);

  const dragStyle = useAnimatedStyle(() => {
    const opacityY = visible.value;
    const opacityX = interpolate(Math.abs(translateX.value), [0, deviceWidth / 2], [1, 0], 'clamp');
    const scale = interpolate(index, [0, 2], [1, 0.95], 'clamp');

    return {
      opacity: opacityY * opacityX,
      transform: [{ translateY: translateY.value }, { translateX: translateX.value }, { scale }],
    };
  });

  const isPressed = useSharedValue(false);

  const pressGesture = useMemo(() => {
    return Gesture.Tap()
      .maxDuration(2000)
      .onTouchesDown(() => {
        isPressed.value = true;
      })
      .onTouchesUp(() => {
        isPressed.value = false;
      })
      .onFinalize(() => {
        isPressed.value = false;
      })
      .onEnd(() => {
        runOnJS(setShowExpandedToasts)(true);
      });
  }, [isPressed]);

  const combinedGesture = useMemo(() => {
    return Gesture.Exclusive(pressGesture, panGesture);
  }, [pressGesture, panGesture]);

  const pressStyleContainer = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isPressed.value ? 0.9 : 1) }],
    };
  });

  const pressStyleContent = useAnimatedStyle(() => {
    const stackOpacity = interpolate(index, [0, 2], [1, 0.8], 'clamp') * interpolate(index, [2, 3], [1, 0], 'clamp');
    const pressOpacity = isPressed.value ? 0.6 : 0.9;

    return {
      opacity: withTiming(pressOpacity * stackOpacity),
    };
  });

  let contents: React.ReactNode = null;

  switch (toast.type) {
    case 'swap':
      contents = <SwapToastContent toast={toast} />;
      break;
    case 'send':
      contents = <SendToastContent toast={toast} />;
      break;
    case 'mint':
      contents = <MintToastContent toast={toast} />;
      break;
  }

  const shadowOpacity = interpolate(index, [0, 2], [0.45, 0.2], 'clamp');

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.View style={[dragStyle, { zIndex: 3 - index }]}>
        <Animated.View
          style={[
            {
              alignItems: 'center',
              justifyContent: 'center',
              shadowRadius: interpolate(index, [0, 2], [8, 2], 'clamp'),
              shadowOpacity: shadowOpacity,
              shadowColor: `rgba(0,0,0,${shadowOpacity})`,
              shadowOffset: { height: interpolate(index, [0, 2], [4, 1], 'clamp'), width: 0 },
            },
            pressStyleContainer,
          ]}
        >
          <Box
            borderRadius={100}
            paddingVertical="8px"
            paddingHorizontal="20px"
            pointerEvents="auto"
            position="absolute"
            top="0px"
            borderColor={isDarkMode ? 'separatorSecondary' : { custom: 'rgba(255, 255, 255, 0.72)' }}
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
                      : ['rgba(255, 255, 255, 0.56)', 'rgba(255, 255, 255, 0.52)']
                  }
                  style={StyleSheet.absoluteFill}
                />
              </>
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? PANEL_COLOR_DARK : globalColors.white100 }]} />
            )}

            {isDarkMode && (
              <LinearGradient
                end={{ x: 0.5, y: 1 }}
                colors={['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0)']}
                start={{ x: 0.5, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            )}

            <Animated.View style={pressStyleContent}>{contents}</Animated.View>
          </Box>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});
