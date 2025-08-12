import { TOAST_EXPANDED_DISMISS_SENSITIVITY, TOAST_EXPANDED_UPWARD_SENSITIVITY_MULTIPLIER } from '@/components/rainbow-toast/constants';
import { ToastExpandedContent } from '@/components/rainbow-toast/ToastExpandedContent';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { Panel } from '@/components/SmoothPager/ListPanel';
import { Box } from '@/design-system';
import { useDimensions } from '@/hooks';
import React, { memo, ReactNode, useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { Gesture, GestureDetector, PanGesture } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setShowExpandedToasts, useToasts, useToastStore } from './useRainbowToasts';
import { springConfigDismiss, springConfigEnter, useVerticalDismissPanGesture } from './useVerticalDismissPanGesture';

const CARD_MARGIN = 20;
const CARD_PADDING = 8;
const ITEM_HEIGHT = 66;

const ExpandedToastCard = ({ width, height, children }: { width: number; height: number; children: React.ReactNode }) => {
  return (
    <Panel style={{ width, height }}>
      <View style={StyleSheet.absoluteFillObject}>{children}</View>
    </Panel>
  );
};

export const RainbowToastExpandedDisplay = memo(function RainbowToastExpandedDisplay() {
  const insets = useSafeAreaInsets();
  const { width: deviceWidth } = useDimensions();
  const showExpanded = useToastStore(state => state.showExpanded);
  const toasts = useToasts();
  const hasToasts = !!toasts.length;

  const restingTranslateY = insets.top + 20;
  const opacity = useSharedValue(0);
  const [pointerEvents, setPointerEvents] = useState<'auto' | 'none'>('none');

  const height = toasts.length * ITEM_HEIGHT + CARD_PADDING * 2;

  const { dragY, panGesture, animateTo } = useVerticalDismissPanGesture({
    onDismiss: useCallback(() => {
      setShowExpandedToasts(false);
    }, []),
    onStartDismiss: useCallback(() => {
      'worklet';
      opacity.value = withSpring(0, springConfigDismiss);
    }, [opacity]),
    height,
    upwardSensitivityMultiplier: TOAST_EXPANDED_UPWARD_SENSITIVITY_MULTIPLIER,
    dismissSensitivity: TOAST_EXPANDED_DISMISS_SENSITIVITY,
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
      setPointerEvents('auto');
    } else {
      animateTo(-20, springConfigDismiss);
      opacity.value = withSpring(0, springConfigDismiss);
      setPointerEvents('none');
    }
  }, [opacity, showExpanded, animateTo, pointerEvents]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
    opacity: opacity.value,
  }));

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
      <Animated.View style={[styles.backdrop, opacityStyle, { pointerEvents: pointerEvents }]}>
        <TouchableWithoutFeedback onPress={hide}>
          <Box style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* content card */}
      <View style={[styles.contentContainer, { pointerEvents: pointerEvents }]}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[animatedStyle, { position: 'absolute', top: restingTranslateY, left: CARD_MARGIN, right: CARD_MARGIN }]}>
            <ExpandedToastCard width={deviceWidth - 2 * CARD_MARGIN} height={height}>
              <View style={styles.toastContentWrapper}>
                {toasts.map(toast => {
                  return (
                    <ToastPressable
                      key={toast.id}
                      panGesture={panGesture}
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
                    </ToastPressable>
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

const ToastPressable = ({ children, panGesture, onPress }: { onPress: () => void; children: ReactNode; panGesture: PanGesture }) => {
  const { pressColor } = useToastColors();
  const isPressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isPressed.value ? pressColor : 'transparent',
  }));

  const tapGesture = Gesture.Tap()
    .maxDeltaY(5)
    .maxDuration(2000)
    .onTouchesDown(() => {
      isPressed.value = true;
    })
    .onStart(() => {
      runOnJS(onPress)();
    })
    .onFinalize(() => {
      isPressed.value = false;
    })
    .simultaneousWithExternalGesture(panGesture);

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[{ height: ITEM_HEIGHT, borderRadius: 10 }, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
};

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
    top: CARD_PADDING,
    left: CARD_PADDING,
    right: CARD_PADDING,
    overflow: 'hidden',
    borderRadius: 36,
  },
});
