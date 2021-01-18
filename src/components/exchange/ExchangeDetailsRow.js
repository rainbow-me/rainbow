import React, { useEffect } from 'react';
import Animated, {
  NewEasing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { Centered, Row } from '../layout';
import ExchangeDetailsButton from './ExchangeDetailsButton';
import SlippageWarning from './SlippageWarning';
import { padding, position } from '@rainbow-me/styles';

const defaultSlippageScale = 1.15;
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
  isSlippageWarningVisible,
  onFlipCurrencies,
  onPressViewDetails,
  showDetailsButton,
  slippage,
  ...props
}) {
  const detailsRowOpacity = useSharedValue(1);
  const slippageOpacity = useSharedValue(0);
  const slippageScale = useSharedValue(defaultSlippageScale);

  const detailsRowStyles = useAnimatedStyle(() => ({
    opacity: detailsRowOpacity.value,
  }));

  const slippageStyles = useAnimatedStyle(() => ({
    opacity: slippageOpacity.value,
    transform: [{ scale: slippageScale.value }],
  }));

  useEffect(() => {
    if (isSlippageWarningVisible) {
      detailsRowOpacity.value = withTiming(0, timingConfig);
      slippageOpacity.value = withTiming(1, timingConfig);
      slippageScale.value = withTiming(1, timingConfig);
    } else {
      detailsRowOpacity.value = withTiming(1, timingConfig);
      slippageOpacity.value = withTiming(0, timingConfig);
      slippageScale.value = withTiming(defaultSlippageScale, timingConfig);
    }
  }, [
    detailsRowOpacity,
    isSlippageWarningVisible,
    slippageOpacity,
    slippageScale,
  ]);

  return (
    <Container {...props}>
      <SlippageWarning
        onPress={onPressViewDetails}
        pointerEvents={isSlippageWarningVisible ? 'auto' : 'none'}
        slippage={slippage}
        style={slippageStyles}
      />
      <AnimatedExchangeDetailsButtonRow
        pointerEvents={isSlippageWarningVisible ? 'none' : 'auto'}
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
