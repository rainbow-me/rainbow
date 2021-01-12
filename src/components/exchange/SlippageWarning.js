import React from 'react';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
// import { convertBipsToPercentage } from '@rainbow-me/helpers/utilities';
import { colors, padding } from '@rainbow-me/styles';

export const SlippageWarningThresholdInBips = 500;
const SevereSlippageThresholdInBips = SlippageWarningThresholdInBips * 2;

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

// const formatSlippage = slippage =>
//   slippage ? convertBipsToPercentage(slippage, 1) : 0;

export default function SlippageWarning({ onPress, slippage, ...props }) {
  const isSevere = slippage >= SevereSlippageThresholdInBips;
  const severityColor = isSevere ? colors.red : colors.warning;

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={1.06}>
      <Container {...props}>
        <Label color={severityColor}>{`􀇿 `}</Label>
        <Label>Small Market</Label>
        <Label color={severityColor}>{` • Losing `}</Label>
        <Label color={severityColor} letterSpacing="roundedTight">
          $120.86
        </Label>
      </Container>
    </ButtonPressAnimation>
  );
}
