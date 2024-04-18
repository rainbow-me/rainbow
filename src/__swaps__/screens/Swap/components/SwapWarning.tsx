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

    // swap quote errors
    [SwapWarningType.no_quote_available]: orange,
    [SwapWarningType.insufficient_liquidity]: orange,
    [SwapWarningType.fee_on_transfer]: orange,
    [SwapWarningType.no_route_found]: orange,
  };

  const warningMessagesPrefix: Record<SwapWarningType, { title: string; subtext: string; addDisplayToTitle?: boolean }> = {
    [SwapWarningType.none]: {
      title: '',
      subtext: '',
    },
    [SwapWarningType.high]: {
      title: `􀇿 ${i18n.t(i18n.l.exchange.price_impact.you_are_losing)}`,
      subtext: i18n.t(i18n.l.exchange.price_impact.small_market_try_smaller_amount),
      addDisplayToTitle: true,
    },
    [SwapWarningType.unknown]: {
      title: `􀇿 ${SwapWarning.swapWarning.value.display}`,
      subtext: i18n.t(i18n.l.exchange.price_impact.unknown_price.description),
    },
    [SwapWarningType.severe]: {
      title: `􀇿 ${i18n.t(i18n.l.exchange.price_impact.you_are_losing)}`,
      subtext: i18n.t(i18n.l.exchange.price_impact.small_market_try_smaller_amount),
      addDisplayToTitle: true,
    },
    [SwapWarningType.long_wait]: {
      title: `􀇿 ${i18n.t(i18n.l.exchange.price_impact.long_wait.title)}`,
      subtext: `${i18n.t(i18n.l.exchange.price_impact.long_wait.description)}`,
      addDisplayToTitle: true,
    },

    // swap quote errors
    [SwapWarningType.no_quote_available]: {
      title: `􀇿 ${i18n.t(i18n.l.exchange.quote_errors.no_quote_available)}`,
      subtext: '',
    },
    [SwapWarningType.insufficient_liquidity]: {
      title: `􀇿 ${i18n.t(i18n.l.exchange.quote_errors.insufficient_liquidity)}`,
      subtext: '',
    },
    [SwapWarningType.fee_on_transfer]: {
      title: `􀇿 ${i18n.t(i18n.l.exchange.quote_errors.fee_on_transfer)}`,
      subtext: '',
    },
    [SwapWarningType.no_route_found]: {
      title: `􀇿 ${i18n.t(i18n.l.exchange.quote_errors.no_route_found)}`,
      subtext: '',
    },
  };

  const warningTitle = useDerivedValue(() => {
    const potentialTitle = warningMessagesPrefix[SwapWarning.swapWarning.value.type].title;
    const addDisplayToTitle = warningMessagesPrefix[SwapWarning.swapWarning.value.type].addDisplayToTitle;
    return addDisplayToTitle ? `${potentialTitle} ${SwapWarning.swapWarning.value.display}` : potentialTitle;
  });

  const warningSubtext = useDerivedValue(() => {
    return warningMessagesPrefix[SwapWarning.swapWarning.value.type].subtext;
  });

  const warningStyles = useAnimatedStyle(() => ({
    color: colorMap[SwapWarning.swapWarning.value.type],
  }));

  const warningSubtextStyles = useAnimatedStyle(() => ({
    display: warningSubtext.value.trim() !== '' ? 'flex' : 'none',
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
        <AnimatedText style={warningSubtextStyles} color="labelQuaternary" align="center" size="13pt" weight="bold" text={warningSubtext} />
      </Box>
    </Box>
  );
};
