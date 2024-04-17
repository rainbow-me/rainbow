import React from 'react';
import * as i18n from '@/languages';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { AnimatedText, Box, Inline, Text, useForegroundColor } from '@/design-system';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { SwapWarningType } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';

export const PriceImpactWarning = () => {
  const { AnimatedSwapStyles, SwapWarning } = useSwapContext();

  const red = useForegroundColor('red');
  const orange = useForegroundColor('orange');

  const warningPrefix = i18n.t(i18n.l.exchange.price_impact.you_are_losing);
  const warningText = useDerivedValue(() => {
    if (SwapWarning.value.type === SwapWarningType.none) return '';
    return `􀇿 ${warningPrefix} ${SwapWarning.value.display}`;
  });

  const warningStyles = useAnimatedStyle(() => {
    return {
      color: SwapWarning.value.type === SwapWarningType.severe ? red : orange,
    };
  });

  return (
    <Box
      as={Animated.View}
      alignItems="center"
      justifyContent="center"
      paddingHorizontal="24px"
      paddingVertical="12px"
      style={[AnimatedSwapStyles.hideWhenInputsExpandedOrNoPriceImpact, { alignSelf: 'center' }]}
    >
      <Box as={Animated.View} alignItems="center" height={{ custom: 33 }} gap={6} justifyContent="center" paddingHorizontal="10px">
        <Inline alignHorizontal="center" alignVertical="center" horizontalSpace="4px" wrap={false}>
          <AnimatedText style={warningStyles} align="center" size="15pt" weight="heavy" text={warningText} />
        </Inline>

        <Text color="labelQuaternary" size="13pt" weight="bold">
          {i18n.t(i18n.l.exchange.price_impact.smal_market_try_smaller_amount)}
        </Text>
      </Box>
    </Box>
  );
};
