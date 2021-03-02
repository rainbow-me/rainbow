import React from 'react';
import styled from 'styled-components';
import { Centered } from '../../layout';
import { Nbsp, Text, TruncatedText } from '../../text';
import { fonts, fontWithWidth } from '@rainbow-me/styles';

export const SwapDetailsRowHeight = 17;

const SwapDetailsText = styled(Text).attrs({
  lineHeight: SwapDetailsRowHeight,
  size: 'smedium',
})``;

export const SwapDetailsLabel = styled(SwapDetailsText).attrs(
  ({ theme: { colors } }) => ({
    color: colors.blueGreyDark50,
  })
)`
  ${fontWithWidth(fonts.weight.semibold)};
`;

export const SwapDetailsValue = styled(SwapDetailsText).attrs(
  ({ theme: { colors }, color = colors.blueGreyDark80 }) => ({
    color,
  })
)`
  ${fontWithWidth(fonts.weight.bold)};
`;

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
