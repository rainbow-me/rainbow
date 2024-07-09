import React from 'react';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { Box } from '@/design-system';
import { SwapNumberPad } from '@/__swaps__/screens/Swap/components/SwapNumberPad';
import { SwapSlider } from '@/__swaps__/screens/Swap/components/SwapSlider';
import { IS_ANDROID } from '@/env';
import { getSoftMenuBarHeight, isSoftMenuBarEnabled } from 'react-native-extra-dimensions-android';
import { safeAreaInsetValues } from '@/utils';

const getAndroidPadding = () => {
  if (isSoftMenuBarEnabled()) {
    return getSoftMenuBarHeight() - 24;
  } else {
    return safeAreaInsetValues.bottom + 34;
  }
};

const BOTTOM_OFFSET = IS_ANDROID ? getAndroidPadding() : safeAreaInsetValues.bottom + 16;
const HEIGHT_OF_BOTTOM_TAB = 64;

export function SliderAndKeyboard() {
  const { AnimatedSwapStyles } = useSwapContext();

  return (
    <Box
      alignItems="flex-end"
      as={Animated.View}
      bottom={{ custom: BOTTOM_OFFSET + HEIGHT_OF_BOTTOM_TAB + 16 }}
      justifyContent="center"
      position="absolute"
      style={[
        { flex: 1, flexDirection: 'column', gap: 16 },
        AnimatedSwapStyles.keyboardStyle,
        AnimatedSwapStyles.hideWhileReviewingOrConfiguringGas,
      ]}
      width="full"
    >
      {/* @ts-expect-error Property 'children' does not exist on type */}
      <PanGestureHandler>
        <Box alignItems="center" style={{ flex: 1 }} width="full">
          <SwapSlider />
          <SwapNumberPad />
        </Box>
      </PanGestureHandler>
    </Box>
  );
}
