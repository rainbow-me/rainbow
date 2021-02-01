import React from 'react';
import styled from 'styled-components';
import { Centered } from '../../layout';
import { Nbsp, Text, TruncatedText } from '../../text';

export const SwapDetailsRowHeight = 17;

const SwapDetailsText = styled(Text).attrs({
  lineHeight: SwapDetailsRowHeight,
  size: 'smedium',
})``;

export const SwapDetailsLabel = styled(SwapDetailsText).attrs(
  ({ theme: { colors } }) => ({
    color: colors.blueGreyDark50,
    weight: 'semibold',
  })
)``;

export const SwapDetailsValue = styled(SwapDetailsText).attrs(
  ({ theme: { colors }, color = colors.blueGreyDark80 }) => ({
    color,
    weight: 'bold',
  })
)``;

export default function SwapDetailsRow({ children, label, ...props }) {
  return (
    <Centered {...props}>
      <SwapDetailsText as={TruncatedText}>
        <SwapDetailsLabel>{label}</SwapDetailsLabel>
        <Nbsp />
        <SwapDetailsValue>{children}</SwapDetailsValue>
      </SwapDetailsText>
    </Centered>
  );
}
