import React from 'react';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import { lightModeThemeColors, padding } from '@rainbow-me/styles';

const ExchangeDetailsButtonLabel = styled(Text).attrs({
  color: lightModeThemeColors.white,
  size: 'large',
  weight: 'bold',
})`
  ${padding(9)};
`;

export default function ExchangeDetailsButton({
  children,
  disabled,
  onPress,
  ...props
}) {
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
