import React from 'react';
import styled from 'styled-components/primitives';
import { Centered } from '../../layout';
import { Nbsp, Text } from '../../text';
import { colors } from '@rainbow-me/styles';

const SwapDetailsText = styled(Text).attrs({ size: 'smedium' })``;

export const SwapDetailsLabel = styled(SwapDetailsText).attrs({
  color: colors.blueGreyDark50,
  weight: 'semibold',
})``;

export const SwapDetailsValue = styled(SwapDetailsText).attrs(
  ({ color = colors.blueGreyDark80 }) => ({
    color,
    weight: 'bold',
  })
)``;

export default function SwapDetailsRow({ children, label, ...props }) {
  return (
    <Centered {...props}>
      <SwapDetailsText>
        <SwapDetailsLabel>{label}</SwapDetailsLabel>
        <Nbsp />
        <SwapDetailsValue>{children}</SwapDetailsValue>
      </SwapDetailsText>
    </Centered>
  );
}
