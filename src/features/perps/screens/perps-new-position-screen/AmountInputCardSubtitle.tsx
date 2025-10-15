import React from 'react';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Box, Inline, useForegroundColor } from '@/design-system';
import { USD_DECIMALS } from '@/features/perps/constants';
import { useOrderAmountValidation } from '@/features/perps/stores/derived/useOrderAmountValidation';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import i18n from '@/languages';
import { truncateToDecimals } from '@/safe-math/SafeMath';
import { ReadOnlySharedValue, useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';

const translations = {
  availableSuffix: i18n.perps.inputs.available(),
  maxSuffix: i18n.perps.inputs.max(),
  minimumSuffix: i18n.perps.inputs.minimum(),
  noBalance: i18n.perps.inputs.no_balance(),
};

export const AmountInputCardSubtitle = ({ availableBalanceString }: { availableBalanceString: ReadOnlySharedValue<string> }) => {
  const hasBalance = useStoreSharedValue(useHyperliquidAccountStore, state => state.hasBalance());
  const validation = useStoreSharedValue(useOrderAmountValidation, state => state);
  const labelSecondary = useForegroundColor('labelSecondary');
  const red = useForegroundColor('red');

  const leftHandText = useDerivedValue(() => {
    if (!hasBalance.value) return translations.noBalance;
    if (validation.value.isBelowMin) return formatCurrency(truncateToDecimals(validation.value.minAmount, USD_DECIMALS));
    return formatCurrency(truncateToDecimals(availableBalanceString.value, USD_DECIMALS));
  });

  const rightHandText = useDerivedValue(() => {
    if (!hasBalance.value) return '';
    if (validation.value.isAboveMax) return translations.maxSuffix;
    if (validation.value.isBelowMin) return translations.minimumSuffix;
    return translations.availableSuffix;
  });

  const errorProgress = useDerivedValue(() =>
    withTiming(validation.value.isAboveMax || validation.value.isBelowMin ? 100 : 0, TIMING_CONFIGS.slowerFadeConfig)
  );

  const errorColor = useDerivedValue(() => interpolateColor(errorProgress.value, [0, 100], [labelSecondary, red], 'LAB'));

  const containerShiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(errorProgress.value, [0, 100], [-19, 0]) }],
  }));

  const errorIconStyle = useAnimatedStyle(() => ({
    opacity: errorProgress.value / 100,
    transform: [{ scale: interpolate(errorProgress.value, [0, 100], [0.84, 1]) }],
  }));

  const leftHandTextStyle = useAnimatedStyle(() => ({ color: errorColor.value }));

  return (
    <Box as={Animated.View} alignItems="center" flexDirection="row" gap={3} style={containerShiftStyle}>
      <AnimatedTextIcon color="red" height={8} size="icon 12px" textStyle={errorIconStyle} weight="black" width={16}>
        􀇿
      </AnimatedTextIcon>
      <Inline alignVertical="center" horizontalSpace="4px">
        <AnimatedText size="15pt" style={leftHandTextStyle} weight="heavy">
          {leftHandText}
        </AnimatedText>
        <AnimatedText color="labelQuaternary" size="15pt" weight="bold">
          {rightHandText}
        </AnimatedText>
      </Inline>
    </Box>
  );
};
