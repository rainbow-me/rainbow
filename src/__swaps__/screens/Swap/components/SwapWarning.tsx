import React from 'react';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { AnimatedText, Box } from '@/design-system';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { SwapWarningType } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { fadeConfig } from '@/__swaps__/screens/Swap/constants';
import { useSwapsStore } from '@/state/swaps/swapsStore';

export const SwapWarning = () => {
  const { AnimatedSwapStyles, SwapWarning, isFetching } = useSwapContext();
  const isDegenModeEnabled = useSwapsStore(s => s.degenMode);

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
      alignItems={isDegenModeEnabled ? 'flex-start' : 'center'}
      height={{ custom: 33 }}
      gap={12}
      justifyContent="center"
      style={AnimatedSwapStyles.hideWhenInputsExpanded}
    >
      <AnimatedText style={warningTitleStyles} align={isDegenModeEnabled ? 'left' : 'center'} size="15pt" weight="heavy">
        {warningTitle}
      </AnimatedText>
      <AnimatedText
        style={warningSubtitleStyles}
        color="labelQuaternary"
        align={isDegenModeEnabled ? 'left' : 'center'}
        size="13pt"
        weight="bold"
      >
        {warningSubtitle}
      </AnimatedText>
    </Box>
  );
};
