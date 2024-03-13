import React from 'react';
import { Box, Inline, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '../constants';
import { opacity } from '../utils';
import { ButtonPressAnimation } from '@/components/animations';
import Animated from 'react-native-reanimated';
import { useSwapContext } from '../providers/swap-provider';

export const ExchangeRateBubble = () => {
  const { isDarkMode } = useColorMode();
  const { AnimatedSwapStyles } = useSwapContext();

  const fillTertiary = useForegroundColor('fillTertiary');

  return (
    <ButtonPressAnimation scaleTo={0.925} style={{ marginTop: 4 }}>
      <Box
        as={Animated.View}
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="24px"
        paddingVertical="12px"
        style={[AnimatedSwapStyles.hideWhenInputsExpanded, { alignSelf: 'center' }]}
      >
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
      </Box>
    </ButtonPressAnimation>
  );
};
