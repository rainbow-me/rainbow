import { TOAST_EXPANDED_DISMISS_SENSITIVITY, TOAST_EXPANDED_UPWARD_SENSITIVITY_MULTIPLIER } from '@/components/rainbow-toast/constants';
import { ToastExpandedContent } from '@/components/rainbow-toast/ToastExpandedContent';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { Panel } from '@/components/SmoothPager/ListPanel';
import { Box } from '@/design-system';
import { useDimensions } from '@/hooks';
import React, { memo, useCallback, useEffect } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { GestureDetector, Pressable } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setShowExpandedToasts, useToastStore } from './useRainbowToasts';
import { springConfigDismiss, springConfigEnter, useVerticalDismissPanGesture } from './useVerticalDismissPanGesture';

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
  const opacity = useSharedValue(0);
  const pointerEvents = useSharedValue<'auto' | 'none'>('none');

  // we know hardcoded height
  const paddingY = 8;
  const itemHeight = 66;
  const height = toasts.length * itemHeight + paddingY * 2;

  const { dragY, pan, animateTo } = useVerticalDismissPanGesture({
    onDismiss: useCallback(() => {
      setShowExpandedToasts(false);
    }, []),
    onStartDismiss: useCallback(() => {
      'worklet';
      opacity.value = withSpring(0, springConfigDismiss);
      pointerEvents.value = 'none';
    }, [opacity, pointerEvents]),
    height,
    upwardSensitivityMultiplier: TOAST_EXPANDED_UPWARD_SENSITIVITY_MULTIPLIER,
    dismissSensitivity: TOAST_EXPANDED_DISMISS_SENSITIVITY,
    initialY: -20,
    dismissTargetY: -100,
  });

  useEffect(() => {
    if (!hasToasts) {
      setShowExpandedToasts(false);
    }
  }, [hasToasts]);

  useEffect(() => {
    if (showExpanded) {
      animateTo(0, springConfigEnter);
      opacity.value = withSpring(1, springConfigEnter);
      pointerEvents.value = 'auto';
    } else {
      animateTo(-20, springConfigDismiss);
      opacity.value = withSpring(0, springConfigDismiss);
      pointerEvents.value = 'none';
    }
  }, [opacity, showExpanded, animateTo, pointerEvents]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
    opacity: opacity.value,
  }));

  const pointerEventsStyle = useAnimatedStyle(() => {
    return {
      pointerEvents: pointerEvents.value,
    };
  });

  const hide = useCallback(() => {
    return new Promise<void>(res => {
      'worklet';
      dragY.value = withSpring(-100, springConfigDismiss, () => {
        runOnJS(setShowExpandedToasts)(false);
      });
      opacity.value = withSpring(0, springConfigDismiss, () => {
        runOnJS(res)();
      });
    });
  }, [opacity, dragY]);

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
