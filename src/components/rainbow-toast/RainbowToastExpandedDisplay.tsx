import { TOAST_EXPANDED_DISMISS_SENSITIVITY, TOAST_EXPANDED_UPWARD_SENSITIVITY_MULTIPLIER } from '@/components/rainbow-toast/constants';
import { ToastExpandedContent } from '@/components/rainbow-toast/ToastExpandedContent';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { Box, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { useDimensions } from '@/hooks';
import { Canvas, Path } from '@shopify/react-native-skia';
import { getSvgPath } from 'figma-squircle';
import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { BlurView } from 'react-native-blur-view';
import { Gesture, GestureDetector, Pressable } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setShowExpandedToasts, useToastStore } from './useRainbowToasts';

const springConfig = { damping: 14, mass: 1, stiffness: 121.6 };
const CARD_BORDER_RADIUS = 50;
const CARD_MARGIN = 20;

const ExpandedToastCard = ({
  width,
  height,
  borderRadius,
  children,
}: {
  width: number;
  height: number;
  borderRadius: number;
  children: React.ReactNode;
}) => {
  const { shadowColor, background, borderColor } = useToastColors();

  const squirclePath = getSvgPath({
    width,
    height,
    cornerRadius: borderRadius,
    cornerSmoothing: 0.6,
  });

  const borderWidth = 1;
  const innerSquirclePath = getSvgPath({
    width: width - borderWidth * 2,
    height: height - borderWidth * 2,
    cornerRadius: borderRadius - borderWidth,
    cornerSmoothing: 0.6,
  });

  return (
    <View style={{ borderRadius, width, height, shadowColor, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, shadowOpacity: 1 }}>
      <Canvas style={[styles.canvasStyle, { width, height }]}>
        <Path path={squirclePath} color={background} />
        <Path
          path={innerSquirclePath}
          color={borderColor}
          style="stroke"
          strokeWidth={1}
          transform={[{ translateX: borderWidth }, { translateY: borderWidth }]}
        />
      </Canvas>
      <View style={StyleSheet.absoluteFillObject}>{children}</View>
    </View>
  );
};

export const RainbowToastExpandedDisplay = memo(function RainbowToastExpandedDisplay() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useColorMode();
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
  const paddingY = 20;
  const itemHeight = 66;
  const height = toasts.length * itemHeight + paddingY * 2;

  useEffect(() => {
    if (!hasToasts) {
      setShowExpandedToasts(false);
    }
  }, [hasToasts]);

  useEffect(() => {
    if (showExpanded) {
      animateY.value = withSpring(0, springConfig);
      opacity.value = withSpring(1, springConfig);
      pointerEvents.value = 'auto';
    } else {
      animateY.value = withSpring(-20, springConfig);
      opacity.value = withSpring(0, springConfig);
      pointerEvents.value = 'auto';
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
        dragY.value = e.translationY;
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
          animateY.value = withSpring(targetY, springConfig, () => {
            runOnJS(setShowExpandedToasts)(false);
          });
          dragY.value = withSpring(0, springConfig);
          opacity.value = withSpring(0, springConfig);
          pointerEvents.value = 'none';
        } else {
          dragY.value = withSpring(0, springConfig);
        }
      });
  }, [dragY, height, animateY, opacity, pointerEvents]);

  const hide = useCallback(() => {
    return new Promise<void>(res => {
      'worklet';
      animateY.value = withSpring(-100, springConfig, () => {
        runOnJS(setShowExpandedToasts)(false);
      });
      dragY.value = withSpring(0, springConfig);
      opacity.value = withSpring(0, springConfig, () => {
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

  const backdropBackgroundColor = IS_IOS
    ? isDarkMode
      ? 'rgba(0,0,0,0.3)'
      : 'rgba(255,255,255,0.2)'
    : isDarkMode
      ? 'rgba(0,0,0,0.6)'
      : 'rgba(255,255,255,0.5)';

  return (
    <>
      {/* backdrop */}
      <Animated.View style={[styles.backdrop, pointerEventsStyle, opacityStyle]}>
        {IS_IOS && <BlurView blurIntensity={1} blurStyle={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
        <TouchableWithoutFeedback onPress={hide}>
          <Box style={{ ...StyleSheet.absoluteFillObject, backgroundColor: backdropBackgroundColor }} />
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
