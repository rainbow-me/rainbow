import React from 'react';
import { type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';

import { SwapWarningType } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Box } from '@/design-system';
import { type SharedOrDerivedValueText } from '@/design-system/components/Text/AnimatedText';
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
    <SwapWarningView
      title={warningTitle}
      subtitle={warningSubtitle}
      titleStyle={warningTitleStyles}
      subtitleStyle={warningSubtitleStyles}
      style={[AnimatedSwapStyles.hideWhenInputsExpanded, warningAlignment]}
    />
  );
};

export function SwapWarningView({
  title,
  subtitle,
  titleStyle,
  subtitleStyle,
  style,
}: {
  title: SharedOrDerivedValueText;
  subtitle: SharedOrDerivedValueText;
  titleStyle: StyleProp<TextStyle>;
  subtitleStyle: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Box as={Animated.View} gap={12} justifyContent="center" style={[{ maxWidth: DEVICE_WIDTH - 120 - 40 }, style]}>
      <AnimatedText style={titleStyle} size="15pt" weight="heavy">
        {title}
      </AnimatedText>
      <AnimatedText style={subtitleStyle} color="labelQuaternary" size="13pt" weight="bold">
        {subtitle}
      </AnimatedText>
    </Box>
  );
}
