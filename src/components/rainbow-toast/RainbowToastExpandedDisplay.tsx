import { TOAST_EXPANDED_DISMISS_SENSITIVITY, TOAST_EXPANDED_UPWARD_SENSITIVITY_MULTIPLIER } from '@/components/rainbow-toast/constants';
import { ToastExpandedContent } from '@/components/rainbow-toast/ToastExpandedContent';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { Panel } from '@/components/SmoothPager/ListPanel';
import { Box } from '@/design-system';
import { useDimensions } from '@/hooks';
import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { Gesture, GestureDetector, Pressable } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setShowExpandedToasts, useToastStore } from './useRainbowToasts';

const springConfigEnter = { damping: 14, mass: 1, stiffness: 121.6 };

// increased speed and quicker settling, faster exit feels better
const springConfigDismiss = {
  restDisplacementThreshold: 1,
  restSpeedThreshold: 20,
  damping: 20,
  mass: 0.8,
  stiffness: 250,
};

const CARD_BORDER_RADIUS = 50;
const CARD_MARGIN = 20;

const ExpandedToastCard = ({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  borderRadius: number;
  children: React.ReactNode;
}) => {
  return (
    <Panel style={{ width, height }}>
      <View style={StyleSheet.absoluteFillObject}>{children}</View>
    </Panel>
  );
};

export const RainbowToastExpandedDisplay = memo(function RainbowToastExpandedDisplay() {
  const insets = useSafeAreaInsets();
  const { width: deviceWidth } = useDimensions();
  const { toasts, showExpanded } = useToastStore();
  const hasToasts = !!toasts.length;
  const { pressColor } = useToastColors();

  const restingTranslateY = insets.top + 20;
  const animateY = useSharedValue(-20);
  const dragY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pointerEvents = useSharedValue<'auto' | 'none'>('none');

  // we know hardcoded height
  const paddingY = 8;
  const itemHeight = 66;
  const height = toasts.length * itemHeight + paddingY * 2;

  useEffect(() => {
    if (!hasToasts) {
      setShowExpandedToasts(false);
    }
  }, [hasToasts]);

  useEffect(() => {
    if (showExpanded) {
      animateY.value = withSpring(0, springConfigEnter);
      opacity.value = withSpring(1, springConfigEnter);
      pointerEvents.value = 'auto';
    } else {
      animateY.value = withSpring(-20, springConfigDismiss);
      opacity.value = withSpring(0, springConfigDismiss);
      pointerEvents.value = 'none';
    }
  }, [opacity, showExpanded, animateY, pointerEvents]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: animateY.value + dragY.value }],
    opacity: opacity.value,
  }));

  const pointerEventsStyle = useAnimatedStyle(() => {
    return {
      pointerEvents: pointerEvents.value,
    };
  });

  const pan = useMemo(() => {
    return Gesture.Pan()
      .onUpdate(e => {
        'worklet';
        const rawTranslation = e.translationY;
        // friction as you drag down
        if (rawTranslation > 0) {
          // reduce movement as distance increases
          const friction = 0.05; // lower = more friction
          dragY.value = rawTranslation * friction + (rawTranslation * (1 - friction)) / (1 + rawTranslation * 0.01);
        } else {
          dragY.value = rawTranslation;
        }
      })
      .onEnd(e => {
        'worklet';
        const dragDistance = dragY.value;
        const adjustedDistance = dragDistance < 0 ? dragDistance * TOAST_EXPANDED_UPWARD_SENSITIVITY_MULTIPLIER : dragDistance;
        const distanceRatio = Math.abs(adjustedDistance) / height;
        const velocityFactor = Math.abs(e.velocityY) / 1000;
        const dismissScore = distanceRatio + velocityFactor;
        const shouldDismiss = dismissScore > TOAST_EXPANDED_DISMISS_SENSITIVITY;

        if (shouldDismiss) {
          const targetY = -100;
          animateY.value = withSpring(targetY, springConfigDismiss, () => {
            runOnJS(setShowExpandedToasts)(false);
          });
          dragY.value = withSpring(0, springConfigDismiss);
          opacity.value = withSpring(0, springConfigDismiss);
          pointerEvents.value = 'none';
        } else {
          dragY.value = withSpring(0, springConfigEnter);
        }
      });
  }, [dragY, height, animateY, opacity, pointerEvents]);

  const hide = useCallback(() => {
    return new Promise<void>(res => {
      'worklet';
      animateY.value = withSpring(-100, springConfigDismiss, () => {
        runOnJS(setShowExpandedToasts)(false);
      });
      dragY.value = withSpring(0, springConfigDismiss);
      opacity.value = withSpring(0, springConfigDismiss, () => {
        runOnJS(res)();
      });
    });
  }, [opacity, animateY, dragY]);

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!showExpanded) {
    return null;
  }

  return (
    <>
      {/* backdrop */}
      <Animated.View style={[styles.backdrop, pointerEventsStyle, opacityStyle]}>
        <TouchableWithoutFeedback onPress={hide}>
          <Box style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* content card */}
      <View style={styles.contentContainer}>
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              animatedStyle,
              pointerEventsStyle,
              { position: 'absolute', top: restingTranslateY, left: CARD_MARGIN, right: CARD_MARGIN },
            ]}
          >
            <ExpandedToastCard width={deviceWidth - 2 * CARD_MARGIN} height={height} borderRadius={CARD_BORDER_RADIUS}>
              <View style={[styles.toastContentWrapper, { paddingVertical: paddingY }]}>
                {toasts.map(toast => {
                  return (
                    <Pressable
                      key={toast.id}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? pressColor : 'transparent',
                        height: itemHeight,
                      })}
                      onPress={() => {
                        if (opacity.value !== 1) {
                          // avoid press after dismiss
                          return;
                        }
                        hide();
                        toast.action?.();
                      }}
                    >
                      <ToastExpandedContent toast={toast} />
                    </Pressable>
                  );
                })}
              </View>
            </ExpandedToastCard>
          </Animated.View>
        </GestureDetector>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    zIndex: 100,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: 'box-none',
  },
  canvasStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  contentContainer: {
    zIndex: 100,
  },
  toastContentWrapper: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderRadius: 50,
  },
});
