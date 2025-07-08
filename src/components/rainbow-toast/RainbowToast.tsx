import type { RainbowToast } from '@/components/rainbow-toast/types';
import { useRainbowToasts } from '@/components/rainbow-toast/useRainbowToasts';
import { Box } from '@/design-system';
import { useDimensions } from '@/hooks';
import React, { PropsWithChildren, useEffect } from 'react';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, WithSpringConfig } from 'react-native-reanimated';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../icons';
import { TruncatedText } from '../text';

export function RainbowToastDisplay() {
  const toasts = useRainbowToasts(state => state.toasts);
  const insets = useSafeAreaInsets();
  const { width: deviceWidth } = useDimensions();

  return (
    <Box position="absolute" top="0px" left="0px" width={deviceWidth} bottom="0px" pointerEvents="none">
      {toasts.map((toast, index) => {
        return <RainbowToast insets={insets} index={index} key={toast.id} toast={toast} />;
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
}>;

function RainbowToast({ toast, index, testID, insets }: Props) {
  const { colors } = useTheme();
  const visible = useSharedValue(0);
  const targetTranslate = insets.top;
  const distance = 30;

  useEffect(() => {
    visible.value = withSpring(1, springConfig);
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = visible.value;
    const translateY = interpolate(visible.value, [0, 1], [distance, targetTranslate], 'extend');

    return {
      opacity,
      transform: [{ translateY }],
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
    <Animated.View pointerEvents="none" style={animatedStyle}>
      <Box alignItems="center" justifyContent="center">
        <Box position="absolute" top="0px" background="fillTertiary" testID={testID}>
          {contents}
        </Box>
      </Box>
    </Animated.View>
  );
}
