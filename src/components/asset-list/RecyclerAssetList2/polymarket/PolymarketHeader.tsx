import React, { memo, useMemo } from 'react';
import { Image, StyleSheet } from 'react-native';

import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';

import CaretImageSource from '@/assets/family-dropdown-arrow.png';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Box, Inline, Text, TextIcon } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { formatCurrency } from '@/features/currency/utils/formatCurrency';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';
import { useCurrentWalletToggles, walletListTogglesActions } from '@/features/wallet/data/walletScreen/base/walletListTogglesStore';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import * as i18n from '@/languages';

const HEIGHT = { custom: 48 } as const;

type PolymarketHeaderProps = {
  hasContent: boolean;
  isDarkMode: boolean;
  totalValueNative: string;
};

export const PolymarketHeader = memo(function PolymarketHeader({ hasContent, totalValueNative, isDarkMode }: PolymarketHeaderProps) {
  const { accentColor: accountColor } = useAccountAccentColor();
  const isOpen = useCurrentWalletToggles(state => state.predictions);

  const animation = useDerivedValue(() => withSpring(hasContent && isOpen ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig));

  const navButtonColors = useMemo(() => {
    return {
      icon: { custom: accountColor },
      border: { custom: opacity(accountColor, isDarkMode ? 0.08 : 0.015) },
      background: opacity(accountColor, isDarkMode ? 0.16 : 0.1),
    };
  }, [accountColor, isDarkMode]);

  const caretAnimatedStyles = useAnimatedStyle(() => ({
    height: 18,
    transform: [{ rotate: `${animation.value * 90}deg` }],
  }));

  const valueAnimatedStyles = useAnimatedStyle(() => ({
    opacity: 1 - animation.value,
  }));

  if (!hasContent) {
    return (
      <ButtonPressAnimation onPress={() => navigateToPolymarket()} scaleTo={1.05}>
        <Box height={HEIGHT} paddingHorizontal="20px" justifyContent="center">
          <Inline alignHorizontal="justify" alignVertical="center">
            <Inline horizontalSpace={'8px'} alignVertical="center">
              <Text size="22pt" color="label" weight="heavy">
                {i18n.t(i18n.l.account.tab_polymarket)}
              </Text>
              <Box
                borderWidth={5 / 3}
                borderColor={navButtonColors.border}
                backgroundColor={navButtonColors.background}
                borderRadius={14}
                height={28}
                width={28}
                justifyContent="center"
                alignItems="center"
              >
                <TextIcon color={navButtonColors.icon} size="icon 14px" weight="heavy">
                  {'􀆊'}
                </TextIcon>
              </Box>
            </Inline>

            <Text align="right" color="labelTertiary" size="20pt" weight="bold">
              {formatCurrency(totalValueNative)}
            </Text>
          </Inline>
        </Box>
      </ButtonPressAnimation>
    );
  }

  return (
    <Box height={HEIGHT} paddingHorizontal="20px" justifyContent="center">
      <Inline alignHorizontal="justify" alignVertical="center">
        <ButtonPressAnimation onPress={() => navigateToPolymarket()} scaleTo={1.05}>
          <Inline horizontalSpace={'8px'} alignVertical="center">
            <Text size="22pt" color="label" weight="heavy">
              {i18n.t(i18n.l.account.tab_polymarket)}
            </Text>
            <Box
              borderWidth={5 / 3}
              borderColor={navButtonColors.border}
              backgroundColor={navButtonColors.background}
              borderRadius={14}
              height={28}
              width={28}
              justifyContent="center"
              alignItems="center"
            >
              <TextIcon color={navButtonColors.icon} size="icon 14px" weight="heavy">
                {'􀆊'}
              </TextIcon>
            </Box>
          </Inline>
        </ButtonPressAnimation>

        <ButtonPressAnimation onPress={togglePredictions} scaleTo={1.05}>
          <Box alignItems="flex-end" justifyContent="center" style={styles.toggleButton}>
            <Inline horizontalSpace="8px" alignVertical="center">
              {!isOpen && (
                <Animated.View style={valueAnimatedStyles}>
                  <Text align="right" color="label" size="20pt" weight="bold">
                    {formatCurrency(totalValueNative)}
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

function togglePredictions(): void {
  walletListTogglesActions.toggle('predictions');
}

const styles = StyleSheet.create({
  toggleButton: {
    minWidth: 100,
  },
});
