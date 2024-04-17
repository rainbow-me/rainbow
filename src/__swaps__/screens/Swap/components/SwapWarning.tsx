import React from 'react';
import * as i18n from '@/languages';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { AnimatedText, Box, Inline, useForegroundColor } from '@/design-system';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { SwapWarningType } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';

export const SwapWarning = () => {
  const { AnimatedSwapStyles, SwapWarning } = useSwapContext();

  const red = useForegroundColor('red');
  const orange = useForegroundColor('orange');

  const colorMap = {
    [SwapWarningType.severe]: red,
    [SwapWarningType.unknown]: red,
    [SwapWarningType.long_wait]: orange,
    [SwapWarningType.none]: orange,
    [SwapWarningType.high]: orange,
  };

  const warningMessages = {
    [SwapWarningType.none]: {
      title: '',
      subtext: '',
    },
    [SwapWarningType.high]: {
      title: `􀇿 ${i18n.t(i18n.l.exchange.price_impact.you_are_losing)} ${SwapWarning.swapWarning.value.display}`,
      subtext: i18n.t(i18n.l.exchange.price_impact.small_market_try_smaller_amount),
    },
    [SwapWarningType.unknown]: {
      title: `􀇿 ${SwapWarning.swapWarning.value.display}`,
      subtext: i18n.t(i18n.l.exchange.price_impact.unknown_price.description),
    },
    [SwapWarningType.severe]: {
      title: `􀇿 ${i18n.t(i18n.l.exchange.price_impact.you_are_losing)} ${SwapWarning.swapWarning.value.display}`,
      subtext: i18n.t(i18n.l.exchange.price_impact.small_market_try_smaller_amount),
    },
    [SwapWarningType.long_wait]: {
      title: `􀇿 ${i18n.t(i18n.l.exchange.price_impact.long_wait.title)}`,
      subtext: `${i18n.t(i18n.l.exchange.price_impact.long_wait.description)} ${SwapWarning.swapWarning.value.display}`,
    },
  };

  const warningTitle = useDerivedValue(() => {
    return warningMessages[SwapWarning.swapWarning.value.type].title;
  });

  const warningSubtext = useDerivedValue(() => {
    return warningMessages[SwapWarning.swapWarning.value.type].subtext;
  });

  const warningStyles = useAnimatedStyle(() => ({
    color: colorMap[SwapWarning.swapWarning.value.type],
  }));

  return (
    <Box
      as={Animated.View}
      alignItems="center"
      justifyContent="center"
      paddingHorizontal="24px"
      paddingVertical="12px"
      style={[AnimatedSwapStyles.hideWhenInputsExpandedOrNoPriceImpact, { alignSelf: 'center', position: 'absolute', top: 8 }]}
    >
      <Box as={Animated.View} alignItems="center" height={{ custom: 33 }} gap={6} justifyContent="center" paddingHorizontal="10px">
        <Inline alignHorizontal="center" alignVertical="center" horizontalSpace="4px" wrap={false}>
          <AnimatedText style={warningStyles} align="center" size="15pt" weight="heavy" text={warningTitle} />
        </Inline>
        <AnimatedText color="labelQuaternary" align="center" size="13pt" weight="bold" text={warningSubtext} />
      </Box>
    </Box>
  );
};
