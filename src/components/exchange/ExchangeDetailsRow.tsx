import lang from 'i18n-js';
import React, { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import ExchangeDetailsButton from './ExchangeDetailsButton';
import PriceImpactWarning from './PriceImpactWarning';
import { analytics } from '@/analytics';
import { Box } from '@/design-system';
import { usePrevious, useSwapCurrencies } from '@/hooks';

const defaultPriceImpactScale = 1.15;
const timingConfig = {
  duration: 200,
  easing: Easing.bezier(0.76, 0, 0.24, 1),
};

interface ExchangeDetailsRowProps {
  isHighPriceImpact: boolean;
  onFlipCurrencies: () => void;
  onPressSettings: () => void;
  onPressImpactWarning: () => void;
  priceImpactColor?: string;
  priceImpactNativeAmount?: string | null;
  priceImpactPercentDisplay?: string | null;
  outputCurrencySymbol?: string | null;
  type: string;
}

export default function ExchangeDetailsRow({
  isHighPriceImpact,
  onFlipCurrencies,
  onPressSettings,
  onPressImpactWarning,
  priceImpactColor,
  priceImpactNativeAmount,
  priceImpactPercentDisplay,
  outputCurrencySymbol,
  type,
}: ExchangeDetailsRowProps) {
  const detailsRowOpacity = useSharedValue(1);
  const priceImpactOpacity = useSharedValue(0);
  const priceImpactScale = useSharedValue(defaultPriceImpactScale);
  const { outputCurrency } = useSwapCurrencies();

  const detailsRowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: detailsRowOpacity.value,
  }));

  const priceImpactAnimatedStyle = useAnimatedStyle(() => ({
    opacity: priceImpactOpacity.value,
    transform: [{ scale: priceImpactScale.value }],
  }));

  const prevIsHighPriceImpact = usePrevious(isHighPriceImpact);

  useEffect(() => {
    if (isHighPriceImpact && !prevIsHighPriceImpact) {
      analytics.track('Showing high price impact warning in Swap', {
        name: outputCurrency.name,
        priceImpact: priceImpactPercentDisplay,
        symbol: outputCurrency.symbol,
        tokenAddress: outputCurrency.address,
        type,
      });
    }
  }, [isHighPriceImpact, outputCurrency, prevIsHighPriceImpact, priceImpactPercentDisplay, type]);

  useEffect(() => {
    if (isHighPriceImpact) {
      detailsRowOpacity.value = withTiming(0, timingConfig);
      priceImpactOpacity.value = withTiming(1, timingConfig);
      priceImpactScale.value = withTiming(1, timingConfig);
    } else {
      detailsRowOpacity.value = withTiming(1, timingConfig);
      priceImpactOpacity.value = withTiming(0, timingConfig);
      priceImpactScale.value = withTiming(defaultPriceImpactScale, timingConfig);
    }
  }, [detailsRowOpacity, isHighPriceImpact, priceImpactOpacity, priceImpactScale]);

  return (
    <Box alignItems="center" height={{ custom: 60 }} justifyContent="center" width="full">
      <PriceImpactWarning
        isHighPriceImpact={isHighPriceImpact}
        onPress={onPressImpactWarning}
        pointerEvents={isHighPriceImpact ? 'auto' : 'none'}
        priceImpactColor={priceImpactColor}
        priceImpactNativeAmount={priceImpactNativeAmount}
        priceImpactPercentDisplay={priceImpactPercentDisplay}
        outputCurrencySymbol={outputCurrencySymbol}
        style={priceImpactAnimatedStyle}
      />
      <Box
        alignItems="center"
        as={Animated.View}
        flexDirection="row"
        justifyContent="space-between"
        padding="10px"
        pointerEvents={isHighPriceImpact ? 'none' : 'auto'}
        style={detailsRowAnimatedStyle}
        width="full"
      >
        {/* @ts-expect-error - Javascript Component */}
        <ExchangeDetailsButton onPress={onFlipCurrencies} testID="exchange-flip-button">
          􀄬 {lang.t('exchange.flip')}
        </ExchangeDetailsButton>
        {/* @ts-expect-error - Javascript Component */}
        <ExchangeDetailsButton onPress={onPressSettings} testID="exchange-settings-button">
          􀣋 {lang.t('exchange.settings')}
        </ExchangeDetailsButton>
      </Box>
    </Box>
  );
}
