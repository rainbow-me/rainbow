import { MintToastExpandedContent } from '@/components/rainbow-toast/MintToastExpandedContent';
import { SwapToastExpandedContent } from '@/components/rainbow-toast/SwapToastExpandedContent';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { Box, useColorMode } from '@/design-system';
import { useDimensions } from '@/hooks';
import { Canvas, Path, Shadow } from '@shopify/react-native-skia';
import { getSvgPath } from 'figma-squircle';
import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { BlurView } from 'react-native-blur-view';
import { Gesture, GestureDetector, Pressable } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { EdgeInsets } from 'react-native-safe-area-context';
import { SendToastExpandedContent } from './SendToastExpandedContent';
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
    <View style={{ width, height, borderRadius }}>
      <Canvas style={[{ position: 'absolute', top: 0, left: 0, width, height }]}>
        <Path path={squirclePath} color="transparent">
          <Shadow dx={0} dy={20} blur={40} color={shadowColor} inner={false} />
        </Path>
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

export function RainbowToastExpandedDisplay({ insets }: { insets: EdgeInsets }) {
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();
  const { toasts, showExpanded } = useToastStore();
  const visibleToasts = toasts.filter(t => !t.removing);
  const hasVisibleToasts = !!visibleToasts.length;
  const { pressColor } = useToastColors();

  const restingTranslateY = insets.top + 20;
  const animateY = useSharedValue(-20);
  const dragY = useSharedValue(0);
  const opacity = useSharedValue(0);

  // we know hardcoded height
  const paddingY = 20;
  const itemHeight = 66;
  const height = visibleToasts.length * itemHeight + paddingY * 2;

  useEffect(() => {
    if (!hasVisibleToasts) {
      setShowExpandedToasts(false);
    }
  }, [hasVisibleToasts]);

  useEffect(() => {
    if (showExpanded) {
      animateY.value = withSpring(0, springConfig);
      opacity.value = withSpring(1, springConfig);
    } else {
      // Reset to initial position when hiding
      animateY.value = -20;
      opacity.value = 0;
    }
  }, [opacity, showExpanded, animateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: animateY.value + dragY.value }],
    opacity: opacity.value,
  }));

  const pan = useMemo(() => {
    return Gesture.Pan()
      .onUpdate(e => {
        dragY.value = e.translationY;
      })
      .onEnd(e => {
        const sensitivity = 0.5; // make dismissing easier (lower) or harder (higher)
        const upwardSensitivityMultiplier = 2; // upward dragging more sensitive
        const dragDistance = dragY.value;
        const adjustedDistance = dragDistance < 0 ? dragDistance * upwardSensitivityMultiplier : dragDistance;
        const distanceRatio = Math.abs(adjustedDistance) / height;
        const velocityFactor = Math.abs(e.velocityY) / 1000;
        const dismissScore = distanceRatio + velocityFactor;
        const shouldDismiss = dismissScore > sensitivity;

        if (shouldDismiss) {
          const targetY = -100;
          animateY.value = withSpring(targetY, springConfig, () => runOnJS(setShowExpandedToasts)(false));
          dragY.value = withSpring(0, springConfig);
          opacity.value = withSpring(0, springConfig);
        } else {
          dragY.value = withSpring(0, springConfig);
        }
      });
  }, [animateY, dragY, opacity, height]);

  const hide = useCallback(() => {
    return new Promise<void>(res => {
      animateY.value = withSpring(-100, springConfig, () => runOnJS(setShowExpandedToasts)(false));
      dragY.value = withSpring(0, springConfig);
      opacity.value = withSpring(0, springConfig, () => {
        'worklet';
        runOnJS(res)();
      });
    });
  }, [opacity, animateY, dragY]);

  const blurAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!showExpanded) {
    return null;
  }

  return (
    <>
      <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, pointerEvents: 'box-none' }, blurAnimatedStyle]}>
        <BlurView blurIntensity={1} blurStyle={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <TouchableWithoutFeedback onPress={hide}>
          <Box style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <View style={{ zIndex: 100 }}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[animatedStyle, { position: 'absolute', top: restingTranslateY, left: CARD_MARGIN, right: CARD_MARGIN }]}>
            <ExpandedToastCard width={deviceWidth - 2 * CARD_MARGIN} height={height} borderRadius={CARD_BORDER_RADIUS}>
              <View
                style={{
                  flex: 1,
                  paddingVertical: paddingY,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  overflow: 'hidden',
                  borderRadius: 50,
                }}
              >
                {visibleToasts.map(toast => {
                  const innerContents = (() => {
                    switch (toast.type) {
                      case 'send':
                        return <SendToastExpandedContent toast={toast} />;
                      case 'swap':
                        return <SwapToastExpandedContent toast={toast} />;
                      case 'mint':
                        return <MintToastExpandedContent toast={toast} />;
                      default:
                        return null;
                    }
                  })();

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
                        hide().then(() => {
                          toast.action?.();
                        });
                      }}
                    >
                      {innerContents}
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
}
