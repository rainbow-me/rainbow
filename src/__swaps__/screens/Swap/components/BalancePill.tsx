import React, { useMemo } from 'react';
import { Box, Text, useColorMode } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

export const BalancePill = ({ balance, showPriceChange }: { balance: string; showPriceChange: boolean }) => {
  const { isDarkMode } = useColorMode();

  const borderColor = useMemo(() => {
    if (showPriceChange) return undefined;
    return isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR;
  }, [isDarkMode, showPriceChange]);

  const borderWidth = useMemo(() => {
    if (showPriceChange) return 0;
    return THICK_BORDER_WIDTH;
  }, [showPriceChange]);

  return (
    <Box
      alignItems="center"
      borderRadius={14}
      height={{ custom: 28 }}
      justifyContent="center"
      paddingHorizontal={{ custom: showPriceChange ? 0 : 8 - THICK_BORDER_WIDTH }}
      style={{
        backgroundColor: 'transparent',
        borderColor,
        borderCurve: 'continuous',
        borderWidth,
        overflow: 'hidden',
      }}
    >
      <Text align="center" color="labelTertiary" size="15pt" weight="bold">
        {balance}
      </Text>
    </Box>
  );
};
