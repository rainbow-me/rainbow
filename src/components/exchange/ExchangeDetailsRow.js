import analytics from '@segment/analytics-react-native';
import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components';
import { Centered, Row } from '../layout';
import ExchangeDetailsButton from './ExchangeDetailsButton';
import PriceImpactWarning from './PriceImpactWarning';
import { usePrevious, useSwapCurrencies } from '@rainbow-me/hooks';
import { padding, position } from '@rainbow-me/styles';

const defaultPriceImpactScale = 1.15;
const timingConfig = {
  duration: 200,
  easing: Easing.bezier(0.76, 0, 0.24, 1),
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
  isHighPriceImpact,
  onFlipCurrencies,
  onPressViewDetails,
  priceImpactColor,
  priceImpactNativeAmount,
  priceImpactPercentDisplay,
  showDetailsButton,
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
  }, [
    isHighPriceImpact,
    outputCurrency,
    prevIsHighPriceImpact,
    priceImpactPercentDisplay,
    type,
  ]);

  useEffect(() => {
    if (isHighPriceImpact) {
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
    isHighPriceImpact,
    priceImpactOpacity,
    priceImpactScale,
  ]);

  return (
    <Container {...props}>
      <PriceImpactWarning
        isHighPriceImpact={isHighPriceImpact}
        onPress={onPressViewDetails}
        pointerEvents={isHighPriceImpact ? 'auto' : 'none'}
        priceImpactColor={priceImpactColor}
        priceImpactNativeAmount={priceImpactNativeAmount}
        priceImpactPercentDisplay={priceImpactPercentDisplay}
        style={priceImpactAnimatedStyle}
      />
      <AnimatedExchangeDetailsButtonRow
        pointerEvents={isHighPriceImpact ? 'none' : 'auto'}
        style={detailsRowAnimatedStyle}
      >
        <ExchangeDetailsButton
          onPress={onFlipCurrencies}
          testID="exchange-flip-button"
        >
          􀄬 Flip
        </ExchangeDetailsButton>
        <ExchangeDetailsButton
          disabled={!showDetailsButton}
          onPress={onPressViewDetails}
          testID="exchange-details-button"
        >
          􀕹 View Details
        </ExchangeDetailsButton>
      </AnimatedExchangeDetailsButtonRow>
    </Container>
  );
}
