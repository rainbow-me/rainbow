import React from 'react';
import { Box, Inline, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '../constants';
import { opacity } from '../utils';

export const ExchangeRateBubble = () => {
  const { isDarkMode } = useColorMode();

  const fillTertiary = useForegroundColor('fillTertiary');

  return (
    <Box
      alignItems="center"
      borderRadius={15}
      height={{ custom: 30 }}
      justifyContent="center"
      paddingHorizontal="10px"
      style={{ borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR, borderWidth: THICK_BORDER_WIDTH }}
    >
      <Inline alignHorizontal="center" alignVertical="center" space="6px" wrap={false}>
        <Text align="center" color="labelQuaternary" size="13pt" style={{ opacity: isDarkMode ? 0.6 : 0.75 }} weight="heavy">
          1 ETH
        </Text>
        <Box
          borderRadius={10}
          height={{ custom: 20 }}
          paddingTop={{ custom: 0.25 }}
          style={{ backgroundColor: opacity(fillTertiary, 0.04) }}
          width={{ custom: 20 }}
        >
          <TextIcon color="labelQuaternary" containerSize={20} opacity={isDarkMode ? 0.6 : 0.75} size="icon 10px" weight="heavy">
            􀄭
          </TextIcon>
        </Box>
        <Text align="center" color="labelQuaternary" size="13pt" style={{ opacity: isDarkMode ? 0.6 : 0.75 }} weight="heavy">
          1,624.04 USDC
        </Text>
      </Inline>
    </Box>
  );
};
