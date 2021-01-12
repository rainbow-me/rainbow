import React from 'react';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { Centered, Row } from '../layout';
import { Text } from '../text';
import SlippageWarning from './SlippageWarning';
import { colors, padding } from '@rainbow-me/styles';

const ExchangeDetailsButtonLabel = styled(Text).attrs({
  color: colors.white,
  size: 'large',
  weight: 'bold',
})`
  ${padding(9)};
`;

const ExchangeDetailsButtonRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(10)};
  width: 100%;
`;

function ExchangeDetailsButton({ children, disabled, onPress, ...props }) {
  return (
    <ButtonPressAnimation
      {...props}
      disabled={disabled}
      onPress={onPress}
      opacity={disabled ? 0.4 : 1}
      scaleTo={1.0666}
    >
      <ExchangeDetailsButtonLabel>{children}</ExchangeDetailsButtonLabel>
    </ButtonPressAnimation>
  );
}

export default function ExchangeDetailsRow({
  isSlippageWarningVisible,
  onFlipCurrencies,
  onPressViewDetails,
  showDetailsButton,
  slippage,
  ...props
}) {
  return (
    <Centered {...props}>
      {isSlippageWarningVisible ? (
        <SlippageWarning slippage={slippage} />
      ) : (
        <ExchangeDetailsButtonRow>
          <ExchangeDetailsButton onPress={onFlipCurrencies}>
            􀄬 Flip
          </ExchangeDetailsButton>
          <ExchangeDetailsButton
            disabled={!showDetailsButton}
            onPress={onPressViewDetails}
          >
            􀕹 View Details
          </ExchangeDetailsButton>
        </ExchangeDetailsButtonRow>
      )}
    </Centered>
  );
}
