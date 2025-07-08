import type { RainbowToast } from '@/components/rainbow-toast/types';
import { removeToast, useRainbowToasts } from '@/components/rainbow-toast/useRainbowToasts';
import { Box } from '@/design-system';
import { useDimensions } from '@/hooks';
import React, { PropsWithChildren, useEffect, useMemo } from 'react';
import { PanResponder } from 'react-native';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, WithSpringConfig } from 'react-native-reanimated';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../icons';
import { TruncatedText } from '../text';

export function RainbowToastDisplay() {
  const toasts = useRainbowToasts();
  const insets = useSafeAreaInsets();
  const { width: deviceWidth } = useDimensions();

  console.log('toasts', toasts);

  return (
    <Box zIndex={100_000} position="absolute" top="0px" left="0px" width={deviceWidth} bottom="0px" pointerEvents="box-none">
      {toasts.map((toast, index) => {
        return <RainbowToast onDismiss={() => removeToast(toast.id)} insets={insets} index={index} key={toast.id} toast={toast} />;
      })}
    </Box>
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

type Props = PropsWithChildren<{
  testID?: string;
  toast: RainbowToast;
  insets: EdgeInsets;
  index: number;
  onDismiss: () => void;
}>;

function RainbowToast({ toast, index, testID, insets, onDismiss }: Props) {
  const { colors } = useTheme();
  const { width: deviceWidth } = useDimensions();
  const visible = useSharedValue(0);
  const translateX = useSharedValue(0);
  const height = 60;
  const gap = index * 4;
  const distance = index * height + gap + insets.top;

  useEffect(() => {
    visible.value = withSpring(1, springConfig);
  }, [visible]);

  const { panHandlers } = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          translateX.value = gestureState.dx;
        },
        onPanResponderRelease: (_, gestureState) => {
          const swipeThreshold = deviceWidth / 4;
          if (Math.abs(gestureState.dx) > swipeThreshold || Math.abs(gestureState.vx) > 0.8) {
            const toValue = gestureState.dx > 0 ? deviceWidth : -deviceWidth;
            translateX.value = withSpring(toValue, { damping: 20, stiffness: 90 }, finished => {
              if (finished) {
                runOnJS(onDismiss)();
              }
            });
          } else {
            translateX.value = withSpring(0, springConfig);
          }
        },
      }),
    [deviceWidth, onDismiss, translateX]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const opacityY = visible.value;
    const translateY = interpolate(visible.value, [0, 1], [0, distance], 'extend');
    const opacityX = interpolate(Math.abs(translateX.value), [0, deviceWidth / 2], [1, 0], 'clamp');

    return {
      opacity: opacityY * opacityX,
      transform: [{ translateY }, { translateX: translateX.value }],
    };
  });

  let contents: React.ReactNode = null;

  switch (toast.type) {
    case 'swap': {
      contents = (
        <>
          <Icon color={colors.whiteLabel} marginTop={3} name="checkmark" />
          <TruncatedText color={colors.whiteLabel} size="smedium" weight="bold">
            {toast.fromToken} 🔜 {toast.toToken}
          </TruncatedText>
        </>
      );
    }
  }

  return (
    <Animated.View style={animatedStyle}>
      <Box alignItems="center" justifyContent="center">
        <Box
          {...panHandlers}
          paddingVertical="2px"
          borderRadius={100}
          paddingHorizontal="8px"
          pointerEvents="auto"
          position="absolute"
          top="0px"
          background="accent"
          testID={testID}
        >
          {contents}
        </Box>
      </Box>
    </Animated.View>
  );
}
