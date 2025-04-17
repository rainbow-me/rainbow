import React from 'react';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Box, Inline } from '@/design-system';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { SwapWarningType } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

export const SwapWarning = () => {
  const {
    AnimatedSwapStyles,
    SwapSettings: { degenMode },
    SwapWarning: { swapWarning },
    isFetching,
    isQuoteStale,
  } = useSwapContext();

  const warningTitle = useDerivedValue(() => {
    if (swapWarning.value.type === SwapWarningType.none) {
      return '';
    }

    let title = '';
    if (swapWarning.value.icon) {
      title = swapWarning.value.icon;
    }
    title += ` ${swapWarning.value.title}`;

    return title;
  });

  const warningSubtitle = useDerivedValue(() => {
    if (swapWarning.value.type === SwapWarningType.none || !swapWarning.value.subtitle) {
      return '';
    }
    return swapWarning.value.subtitle;
  });

  const warningTitleStyles = useAnimatedStyle(() => ({
    color: swapWarning.value.color,
    opacity: withSpring(isFetching.value || isQuoteStale.value ? 0.4 : 1, SPRING_CONFIGS.sliderConfig),
    textAlign: degenMode.value ? 'left' : 'center',
  }));

  const warningSubtitleStyles = useAnimatedStyle(() => {
    return {
      opacity: withSpring(
        warningSubtitle.value.trim() === '' ? 0 : isFetching.value || isQuoteStale.value ? 0.4 : 1,
        SPRING_CONFIGS.sliderConfig
      ),
      textAlign: degenMode.value ? 'left' : 'center',
    };
  });

  const warningAlignment = useAnimatedStyle(() => {
    return {
      alignItems: degenMode.value ? 'flex-start' : 'center',
    };
  });

  return (
    <Box
      as={Animated.View}
      gap={12}
      justifyContent="center"
      style={[{ maxWidth: DEVICE_WIDTH - 120 - 40 }, AnimatedSwapStyles.hideWhenInputsExpanded, warningAlignment]}
    >
      <AnimatedText style={warningTitleStyles} size="15pt" weight="heavy">
        {warningTitle}
      </AnimatedText>
      <AnimatedText style={warningSubtitleStyles} color="labelQuaternary" size="13pt" weight="bold">
        {warningSubtitle}
      </AnimatedText>
    </Box>
  );
};
