import React from 'react';
import { Box } from '@/design-system/components/Box/Box';
import { Text } from '@/design-system/components/Text/Text';
import { useColorMode } from '@/design-system/color/ColorMode';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

export const BalancePill = ({ balance }: { balance: string }) => {
  const { isDarkMode } = useColorMode();

  return (
    <Box
      alignItems="center"
      borderRadius={14}
      height={{ custom: 28 }}
      justifyContent="center"
      paddingHorizontal={{ custom: 8 - THICK_BORDER_WIDTH }}
      style={{
        backgroundColor: 'transparent',
        borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR,
        borderCurve: 'continuous',
        borderWidth: THICK_BORDER_WIDTH,
        overflow: 'hidden',
      }}
    >
      <Text align="center" color="labelTertiary" size="15pt" weight="bold">
        {balance}
      </Text>
    </Box>
  );
};
