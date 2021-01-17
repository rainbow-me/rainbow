import React from 'react';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { useSlippageDetails } from '@rainbow-me/hooks';
import { colors, padding } from '@rainbow-me/styles';

const Container = styled(Centered).attrs({
  shrink: 0,
})`
  ${padding(19)};
  width: 100%;
`;

const Label = styled(Text).attrs(({ color = colors.white, letterSpacing }) => ({
  color,
  letterSpacing,
  size: 'large',
  weight: 'bold',
}))``;

export default function SlippageWarning({ onPress, slippage, ...props }) {
  const { color } = useSlippageDetails(slippage);

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={1.06}>
      <Container {...props}>
        <Label color={color}>{`􀇿 `}</Label>
        <Label>Small Market</Label>
        <Label color={color}>{` • Losing `}</Label>
        <Label color={color} letterSpacing="roundedTight">
          $TODO
        </Label>
      </Container>
    </ButtonPressAnimation>
  );
}
