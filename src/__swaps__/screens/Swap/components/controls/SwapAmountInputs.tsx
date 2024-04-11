import React from 'react';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { Box } from '@/design-system';
import { SwapActions } from '@/__swaps__/screens/Swap/components/controls/SwapActions';
import { SwapNumberPad } from '@/__swaps__/screens/Swap/components/SwapNumberPad';
import { SwapSlider } from '@/__swaps__/screens/Swap/components/SwapSlider';

export function SwapAmountInputs() {
  const { AnimatedSwapStyles } = useSwapContext();

  return (
    <Box
      alignItems="flex-end"
      as={Animated.View}
      bottom="0px"
      justifyContent="center"
      position="absolute"
      style={[{ flex: 1, flexDirection: 'column', gap: 16 }, AnimatedSwapStyles.keyboardStyle]}
      width="full"
    >
      {/* @ts-expect-error */}
      <PanGestureHandler>
        <Box alignItems="center" style={{ flex: 1 }} width="full">
          <SwapSlider />
          <SwapNumberPad />
        </Box>
      </PanGestureHandler>
      <SwapActions />
    </Box>
  );
}
