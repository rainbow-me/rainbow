import React from 'react';
import styled from 'styled-components';
import { Centered } from '../../layout';
import { Nbsp, Text, TruncatedText } from '../../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, fontWithWidth } from '@rainbow-me/styles';

export const SwapDetailsRowHeight = 17;

const SwapDetailsText = styled(Text).attrs({
  lineHeight: SwapDetailsRowHeight,
  size: 'smedium',
})``;

export const SwapDetailsLabel = styled(SwapDetailsText).attrs(
  ({ theme: { colors } }) => ({
    color: colors.alpha(colors.blueGreyDark, 0.5),
  })
)`
  ${fontWithWidth(fonts.weight.semibold)};
`;

export const SwapDetailsValue = styled(SwapDetailsText).attrs(
  ({ theme: { colors }, color = colors.alpha(colors.blueGreyDark, 0.8) }) => ({
    color,
  })
)`
  ${fontWithWidth(fonts.weight.bold)};
`;

export default function SwapDetailsRow({ children, label, ...props }: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SwapDetailsText as={TruncatedText}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SwapDetailsLabel>{label}</SwapDetailsLabel>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Nbsp />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SwapDetailsValue>{children}</SwapDetailsValue>
      </SwapDetailsText>
    </Centered>
  );
}
