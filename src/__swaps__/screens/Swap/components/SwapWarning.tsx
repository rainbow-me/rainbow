import React from 'react';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { AnimatedText, Box, Inline } from '@/design-system';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { SwapWarningType } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { fadeConfig } from '@/__swaps__/screens/Swap/constants';

export const SwapWarning = () => {
  const { AnimatedSwapStyles, SwapWarning, isFetching } = useSwapContext();

  const warningTitle = useDerivedValue(() => {
    if (SwapWarning.swapWarning.value.type === SwapWarningType.none) {
      return '';
    }

    let title = '';
    if (SwapWarning.swapWarning.value.icon) {
      title = SwapWarning.swapWarning.value.icon;
    }
    title += ` ${SwapWarning.swapWarning.value.title}`;

    return title;
  });

  const warningSubtitle = useDerivedValue(() => {
    if (SwapWarning.swapWarning.value.type === SwapWarningType.none || !SwapWarning.swapWarning.value.subtitle) {
      return '';
    }
    return SwapWarning.swapWarning.value.subtitle;
  });

  const warningTitleStyles = useAnimatedStyle(() => ({
    opacity: withTiming(isFetching.value ? 0.4 : 1, fadeConfig),
    color: SwapWarning.swapWarning.value.color,
  }));

  const warningSubtitleStyles = useAnimatedStyle(() => {
    if (warningSubtitle.value.trim() === '') {
      return {
        opacity: withTiming(0, fadeConfig),
      };
    }

    return {
      opacity: withTiming(isFetching.value ? 0.4 : 1, fadeConfig),
    };
  });

  return (
    <Box
      as={Animated.View}
      alignItems="center"
      justifyContent="center"
      paddingHorizontal="24px"
      paddingVertical="16px"
      style={[AnimatedSwapStyles.hideWhenInputsExpandedOrNoPriceImpact, { alignSelf: 'center', position: 'absolute', top: 8 }]}
    >
      <Box as={Animated.View} alignItems="center" height={{ custom: 33 }} gap={12} justifyContent="center" paddingHorizontal="10px">
        <Inline alignHorizontal="center" alignVertical="center" horizontalSpace="4px" wrap={false}>
          <AnimatedText style={warningTitleStyles} align="center" size="15pt" weight="heavy">
            {warningTitle}
          </AnimatedText>
        </Inline>
        <AnimatedText
          style={warningSubtitleStyles}
          color="labelQuaternary"
          align="center"
          size="13pt"
          weight="bold"
          text={warningSubtitle}
        />
      </Box>
    </Box>
  );
};
