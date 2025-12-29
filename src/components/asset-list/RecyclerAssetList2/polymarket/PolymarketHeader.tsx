import React, { memo, useMemo } from 'react';
import { Image } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import CaretImageSource from '@/assets/family-dropdown-arrow.png';
import * as i18n from '@/languages';
import { formatCurrency } from '@/helpers/strings';
import { ButtonPressAnimation } from '@/components/animations';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, Inline, Text, TextIcon } from '@/design-system';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { usePolymarketAccountValueSummary } from '@/features/polymarket/stores/derived/usePolymarketAccountValueSummary';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';
import useOpenPolymarket from '@/hooks/useOpenPolymarket';

const HEIGHT = 48;

export const PolymarketHeader = memo(function PolymarketHeader({ isDarkMode }: { isDarkMode: boolean }) {
  const accountValueNative = usePolymarketAccountValueSummary(state => state.totalValueNative);
  const { accentColor: accountColor } = useAccountAccentColor();
  const { isPolymarketOpen, toggleOpenPolymarket } = useOpenPolymarket();

  const animation = useDerivedValue(() => withSpring(isPolymarketOpen ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig));

  const navigationButtonColors = useMemo(() => {
    return {
      icon: accountColor,
      border: opacityWorklet(accountColor, isDarkMode ? 0.08 : 0.015),
      background: opacityWorklet(accountColor, isDarkMode ? 0.16 : 0.1),
    };
  }, [accountColor, isDarkMode]);

  const caretAnimatedStyles = useAnimatedStyle(() => ({
    height: 18,
    transform: [{ rotate: `${animation.value * 90}deg` }],
  }));

  const valueAnimatedStyles = useAnimatedStyle(() => ({
    opacity: 1 - animation.value,
  }));

  return (
    <Box height={{ custom: HEIGHT }} paddingHorizontal="20px" justifyContent="center">
      <Inline alignHorizontal="justify" alignVertical="center">
        <ButtonPressAnimation onPress={navigateToPolymarket} scaleTo={1.05}>
          <Inline horizontalSpace={'8px'} alignVertical="center">
            <Text size="22pt" color="label" weight="heavy">
              {i18n.t(i18n.l.account.tab_polymarket)}
            </Text>
            <Box
              borderWidth={5 / 3}
              borderColor={{ custom: navigationButtonColors.border }}
              backgroundColor={navigationButtonColors.background}
              borderRadius={14}
              height={28}
              width={28}
              justifyContent="center"
              alignItems="center"
            >
              <TextIcon color={{ custom: navigationButtonColors.icon }} size="icon 14px" weight="heavy">
                {'􀆊'}
              </TextIcon>
            </Box>
          </Inline>
        </ButtonPressAnimation>

        <ButtonPressAnimation onPress={toggleOpenPolymarket} scaleTo={1.05}>
          <Box alignItems="flex-end" justifyContent="center" style={{ minWidth: 100 }}>
            <Inline horizontalSpace="8px" alignVertical="center">
              {!isPolymarketOpen && (
                <Animated.View style={valueAnimatedStyles}>
                  <Text align="right" color="label" size="20pt" weight="bold">
                    {formatCurrency(accountValueNative)}
                  </Text>
                </Animated.View>
              )}
              <Animated.View style={caretAnimatedStyles}>
                <Image source={CaretImageSource} tintColor={isDarkMode ? '#fff' : '#000'} />
              </Animated.View>
            </Inline>
          </Box>
        </ButtonPressAnimation>
      </Inline>
    </Box>
  );
});
