import React from 'react';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { Box } from '@/design-system';
import { SwapNumberPad } from '@/__swaps__/screens/Swap/components/SwapNumberPad';
import { SwapSlider } from '@/__swaps__/screens/Swap/components/SwapSlider';
import { BOTTOM_ACTION_BAR_HEIGHT } from '../constants';

export function SliderAndKeyboard() {
  const { AnimatedSwapStyles } = useSwapContext();

  return (
    <Box
      alignItems="flex-end"
      as={Animated.View}
      bottom={{ custom: BOTTOM_ACTION_BAR_HEIGHT + 16 }}
      justifyContent="center"
      position="absolute"
      style={[
        { flex: 1, flexDirection: 'column', gap: 16 },
        AnimatedSwapStyles.keyboardStyle,
        AnimatedSwapStyles.hideWhileReviewingOrConfiguringGas,
      ]}
      width="full"
    >
      <PanGestureHandler>
        <Box alignItems="center" style={{ flex: 1 }} width="full">
          <SwapSlider />
          <SwapNumberPad />
        </Box>
      </PanGestureHandler>
    </Box>
  );
}
