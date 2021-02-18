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
  usePriceImpactDetails,
  useSwapInputOutputTokens,
  useSwapInputValues,
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
  onFlipCurrencies,
  onPressViewDetails,
  showDetailsButton,
  type,
  ...props
}) {
  const detailsRowOpacity = useSharedValue(1);
  const priceImpactOpacity = useSharedValue(0);
  const priceImpactScale = useSharedValue(defaultPriceImpactScale);
  const { outputCurrency } = useSwapInputOutputTokens();
  const { isHighPriceImpact, percentDisplay } = usePriceImpactDetails();

  const detailsRowStyles = useAnimatedStyle(() => ({
    opacity: detailsRowOpacity.value,
  }));

  const priceImpactStyles = useAnimatedStyle(() => ({
    opacity: priceImpactOpacity.value,
    transform: [{ scale: priceImpactScale.value }],
  }));

  const {
    inputAmount,
    isSufficientBalance,
    outputAmount,
  } = useSwapInputValues();

  const isPriceImpactWarningVisible =
    isSufficientBalance && !!inputAmount && !!outputAmount && isHighPriceImpact;
  const prevIsPriceImpactWarningVisible = usePrevious(
    isPriceImpactWarningVisible
  );
  useEffect(() => {
    if (isPriceImpactWarningVisible && !prevIsPriceImpactWarningVisible) {
      analytics.track('Showing high price impact warning in Swap', {
        name: outputCurrency.name,
        priceImpact: percentDisplay,
        symbol: outputCurrency.symbol,
        tokenAddress: outputCurrency.address,
        type,
      });
    }
  }, [
    isPriceImpactWarningVisible,
    outputCurrency,
    prevIsPriceImpactWarningVisible,
    percentDisplay,
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
        style={priceImpactStyles}
      />
      <AnimatedExchangeDetailsButtonRow
        pointerEvents={isPriceImpactWarningVisible ? 'none' : 'auto'}
        style={detailsRowStyles}
      >
        <ExchangeDetailsButton onPress={onFlipCurrencies}>
          􀄬 Flip
        </ExchangeDetailsButton>
        <ExchangeDetailsButton
          disabled={!showDetailsButton}
          onPress={onPressViewDetails}
        >
          􀕹 View Details
        </ExchangeDetailsButton>
      </AnimatedExchangeDetailsButtonRow>
    </Container>
  );
}
