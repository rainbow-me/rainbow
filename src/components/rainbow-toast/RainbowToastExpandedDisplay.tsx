import { Box, useBackgroundColor, useColorMode } from '@/design-system';
import { useDimensions } from '@/hooks';
import { Canvas, Path, Shadow } from '@shopify/react-native-skia';
import { getSvgPath } from 'figma-squircle';
import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { BlurView } from 'react-native-blur-view';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { EdgeInsets } from 'react-native-safe-area-context';
import { SendToastExpandedContent } from './SendToastExpandedContent';
import { setShowExpanded, useToastStore } from './useRainbowToasts';

const springConfig = { damping: 14, mass: 1, stiffness: 121.6 };
const CARD_BORDER_RADIUS = 60;
const CARD_MARGIN = 20;
const CARD_HEIGHT = 400;

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
  const { isDarkMode } = useColorMode();
  const backgroundColor = useBackgroundColor('surfacePrimary');
  const shadowColor = isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)';

  const squirclePath = getSvgPath({
    width,
    height,
    cornerRadius: borderRadius,
    cornerSmoothing: 0.6,
  });

  return (
    <View style={{ width, height, overflow: 'hidden', borderRadius }}>
      <Canvas style={{ position: 'absolute', top: 0, left: 0, width, height }}>
        <Path path={squirclePath} color="transparent">
          <Shadow dx={0} dy={4} blur={8} color={shadowColor} inner={false} />
        </Path>
        <Path path={squirclePath} color={backgroundColor} />
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

  const restingTranslateY = insets.top + 20;
  const animateY = useSharedValue(-20);
  const dragY = useSharedValue(0);
  const opacity = useSharedValue(0);

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
        const thresh = CARD_HEIGHT * 0.3;
        const shouldDismiss = Math.abs(dragY.value) > thresh || Math.abs(e.velocityY) > 500;

        if (shouldDismiss) {
          // Animate out in the direction of the drag
          const targetY = dragY.value > 0 ? CARD_HEIGHT : -CARD_HEIGHT - restingTranslateY;
          animateY.value = withSpring(targetY, springConfig, () => runOnJS(setShowExpanded)(false));
          dragY.value = withSpring(0, springConfig);
          opacity.value = withSpring(0, springConfig);
        } else {
          dragY.value = withSpring(0, springConfig);
        }
      });
  }, [restingTranslateY, animateY, dragY, opacity]);

  const backdropPress = useCallback(() => {
    animateY.value = withSpring(-CARD_HEIGHT - restingTranslateY, springConfig, () => runOnJS(setShowExpanded)(false));
    dragY.value = withSpring(0, springConfig);
    opacity.value = withSpring(0, springConfig);
  }, [opacity, restingTranslateY, animateY, dragY]);

  if (!showExpanded) {
    return null;
  }

  console.log('visibleToasts', visibleToasts);

  return (
    <>
      <Box position="absolute" top="0px" bottom="0px" left="0px" right="0px" pointerEvents="box-none">
        <BlurView blurIntensity={1} blurStyle={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <TouchableWithoutFeedback onPress={backdropPress}>
          <Box style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }} />
        </TouchableWithoutFeedback>
      </Box>

      <View style={{ zIndex: 100 }}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[animatedStyle, { position: 'absolute', top: restingTranslateY, left: CARD_MARGIN, right: CARD_MARGIN }]}>
            <ExpandedToastCard width={deviceWidth - 2 * CARD_MARGIN} height={CARD_HEIGHT} borderRadius={CARD_BORDER_RADIUS}>
              <Box gap={12} flexGrow={1} padding="20px">
                {visibleToasts.map(toast => {
                  switch (toast.type) {
                    case 'send':
                      return <SendToastExpandedContent key={toast.id} toast={toast} />;
                    default:
                      return null;
                  }
                })}
              </Box>
            </ExpandedToastCard>
          </Animated.View>
        </GestureDetector>
      </View>
    </>
  );
}
