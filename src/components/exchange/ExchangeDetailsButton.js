import React from 'react';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import styled from '@/styled-thing';
import { lightModeThemeColors, padding } from '@/styles';

const ExchangeDetailsButtonLabel = styled(Text).attrs({
  color: lightModeThemeColors.white,
  size: 'large',
  weight: 'heavy',
  ...(android && { lineHeight: 21 }),
})({
  ...padding.object(9),
});

export default function ExchangeDetailsButton({ children, disabled, onPress, ...props }) {
  return (
    <ButtonPressAnimation {...props} disabled={disabled} onPress={onPress} scaleTo={1.0666} style={{ opacity: disabled ? 0.4 : 1 }}>
      <ExchangeDetailsButtonLabel>{children}</ExchangeDetailsButtonLabel>
    </ButtonPressAnimation>
  );
}
