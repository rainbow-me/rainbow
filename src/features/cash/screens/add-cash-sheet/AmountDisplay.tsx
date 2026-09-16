import React, { memo } from 'react';

import Animated, { useAnimatedStyle, useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { RollMode, SkiaAnimatedNumber } from '@/components/animated-number/SkiaAnimatedNumber';
import { PANEL_BACKGROUND_DARK, PANEL_BACKGROUND_LIGHT } from '@/components/PanelSheet/PanelSheet';
import { Box, useColorMode } from '@/design-system';
import { addCommasToNumber } from '@/framework/ui/utils/addCommasToNumber';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

export const AmountDisplay = memo(function AmountDisplay({
  displayedAmount,
  shakeOffset,
}: {
  displayedAmount: SharedValue<string>;
  shakeOffset: SharedValue<number>;
}) {
  const { isDarkMode } = useColorMode();

  const formattedAmount = useDerivedValue(() => `$${addCommasToNumber(displayedAmount.value || '0', '0')}`);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeOffset.value }] }));

  return (
    <Box
      as={Animated.View}
      alignItems="center"
      justifyContent="center"
      style={shakeStyle}
      testID="cash-deposit-add-cash-amount-display-container"
      width="full"
    >
      <SkiaAnimatedNumber
        align="center"
        backgroundColor={isDarkMode ? PANEL_BACKGROUND_DARK : PANEL_BACKGROUND_LIGHT}
        bleedHorizontal={0}
        color="label"
        fitToWidth
        paddingHorizontal={32}
        rollMode={RollMode.None}
        size="76pt"
        testID="cash-deposit-add-cash-amount-display"
        value={formattedAmount}
        weight="heavy"
        width={DEVICE_WIDTH}
      />
    </Box>
  );
});
