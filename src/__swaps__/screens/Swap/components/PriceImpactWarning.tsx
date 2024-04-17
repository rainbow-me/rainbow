import React from 'react';
import Animated, { useDerivedValue } from 'react-native-reanimated';
import { AnimatedText, Box, Inline, Text, TextIcon, useForegroundColor } from '@/design-system';
import { opacity } from '@/__swaps__/utils/swaps';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';

export const PriceImpactWarning = () => {
  const { AnimatedSwapStyles, PriceImpactWarning } = useSwapContext();

  const warningText = useDerivedValue(() => {
    if (!PriceImpactWarning.value) return '';
    return `You're losing ${PriceImpactWarning.value?.impactDisplay}`;
  });

  const fillTertiary = useForegroundColor('fillTertiary');

  return (
    <Box
      as={Animated.View}
      alignItems="center"
      justifyContent="center"
      paddingHorizontal="24px"
      paddingVertical="12px"
      style={[AnimatedSwapStyles.hideWhenInputsExpanded, AnimatedSwapStyles.hideWhenPriceWarningIsNotPresent, { alignSelf: 'center' }]}
    >
      <Box as={Animated.View} alignItems="center" height={{ custom: 33 }} gap={6} justifyContent="center" paddingHorizontal="10px">
        <Inline alignHorizontal="center" alignVertical="center" horizontalSpace="4px" wrap={false}>
          <Box
            borderRadius={10}
            height={{ custom: 20 }}
            paddingTop={{ custom: 0.25 }}
            style={{ backgroundColor: opacity(fillTertiary, 0.04) }}
            width={{ custom: 20 }}
          >
            <TextIcon color="orange" containerSize={20} size="15pt" weight="heavy">
              􀇿
            </TextIcon>
          </Box>
          <AnimatedText align="center" color="orange" size="15pt" weight="heavy" text={warningText} />
        </Inline>

        {/* TODO: Make this i18n */}
        <Text color="labelQuaternary" size="13pt" weight="bold">
          Small market –– try a smaller amount
        </Text>
      </Box>
    </Box>
  );
};
