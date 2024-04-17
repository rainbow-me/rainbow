import React from 'react';
import * as i18n from '@/languages';
import Animated, { useDerivedValue } from 'react-native-reanimated';
import { AnimatedText, Box, Inline, Text, TextIcon } from '@/design-system';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { SwapPriceImpactType } from '@/__swaps__/screens/Swap/hooks/usePriceImpactWarning';

export const PriceImpactWarning = () => {
  const { AnimatedSwapStyles, PriceImpactWarning } = useSwapContext();

  const warningPrefix = i18n.t(i18n.l.exchange.price_impact.you_are_losing);

  const warningText = useDerivedValue(() => {
    if (PriceImpactWarning.value.type === SwapPriceImpactType.none) return '';
    return `${warningPrefix} ${PriceImpactWarning.value.impactDisplay}`;
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
          <Box borderRadius={10} height={{ custom: 20 }} paddingTop={{ custom: 0.25 }} width={{ custom: 20 }}>
            <TextIcon color="orange" containerSize={20} size="15pt" weight="heavy">
              􀇿
            </TextIcon>
          </Box>
          <AnimatedText align="center" color="orange" size="15pt" weight="heavy" text={warningText} />
        </Inline>

        <Text color="labelQuaternary" size="13pt" weight="bold">
          {i18n.t(i18n.l.exchange.price_impact.smal_market_try_smaller_amount)}
        </Text>
      </Box>
    </Box>
  );
};
