import analytics from '@segment/analytics-react-native';
import React, { useEffect } from 'react';
import Animated, {
  NewEasing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components';
import { Centered, Row } from '../layout';
import ExchangeDetailsButton from './ExchangeDetailsButton';
import PriceImpactWarning from './PriceImpactWarning';
import {
  usePrevious,
  useSwapCurrencies,
  useSwapIsSufficientBalance,
} from '@rainbow-me/hooks';
import { padding, position } from '@rainbow-me/styles';

const defaultPriceImpactScale = 1.15;
const timingConfig = {
  duration: 200,
  easing: NewEasing.bezier(0.76, 0, 0.24, 1),
};

const Container = styled(Centered)`
  height: 60;
  width: 100%;
`;

const ExchangeDetailsButtonRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(10)};
  ${position.cover};
  width: 100%;
`;

const AnimatedExchangeDetailsButtonRow = Animated.createAnimatedComponent(
  ExchangeDetailsButtonRow
);

export default function ExchangeDetailsRow({
  inputAmount,
  isHighPriceImpact,
  onFlipCurrencies,
  onPressViewDetails,
  outputAmount,
  priceImpactColor,
  priceImpactNativeAmount,
  priceImpactPercentDisplay,
  type,
  ...props
}) {
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

  const isSufficientBalance = useSwapIsSufficientBalance(inputAmount);

  const isPriceImpactWarningVisible =
    isSufficientBalance && !!inputAmount && !!outputAmount && isHighPriceImpact;
  const prevIsPriceImpactWarningVisible = usePrevious(
    isPriceImpactWarningVisible
  );
  useEffect(() => {
    if (isPriceImpactWarningVisible && !prevIsPriceImpactWarningVisible) {
      analytics.track('Showing high price impact warning in Swap', {
        name: outputCurrency.name,
        priceImpact: priceImpactPercentDisplay,
        symbol: outputCurrency.symbol,
        tokenAddress: outputCurrency.address,
        type,
      });
    }
  }, [
    isPriceImpactWarningVisible,
    outputCurrency,
    prevIsPriceImpactWarningVisible,
    priceImpactPercentDisplay,
    type,
  ]);

  useEffect(() => {
    if (isPriceImpactWarningVisible) {
      detailsRowOpacity.value = withTiming(0, timingConfig);
      priceImpactOpacity.value = withTiming(1, timingConfig);
      priceImpactScale.value = withTiming(1, timingConfig);
    } else {
      detailsRowOpacity.value = withTiming(1, timingConfig);
      priceImpactOpacity.value = withTiming(0, timingConfig);
      priceImpactScale.value = withTiming(
        defaultPriceImpactScale,
        timingConfig
      );
    }
  }, [
    detailsRowOpacity,
    isPriceImpactWarningVisible,
    priceImpactOpacity,
    priceImpactScale,
  ]);

  return (
    <Container {...props}>
      <PriceImpactWarning
        onPress={onPressViewDetails}
        pointerEvents={isPriceImpactWarningVisible ? 'auto' : 'none'}
        priceImpactColor={priceImpactColor}
        priceImpactNativeAmount={priceImpactNativeAmount}
        style={priceImpactAnimatedStyle}
      />
      <AnimatedExchangeDetailsButtonRow
        pointerEvents={isPriceImpactWarningVisible ? 'none' : 'auto'}
        style={detailsRowAnimatedStyle}
      >
        <ExchangeDetailsButton onPress={onFlipCurrencies}>
          􀄬 Flip
        </ExchangeDetailsButton>
        <ExchangeDetailsButton onPress={onPressViewDetails}>
          􀕹 View Details
        </ExchangeDetailsButton>
      </AnimatedExchangeDetailsButtonRow>
    </Container>
  );
}
