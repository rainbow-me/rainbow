import React from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../Divider' was resolved to '/Users/nic... Remove this comment to see the full error message
import Divider from '../../Divider';
import { Centered, Column, ColumnWithMargins, Row } from '../../layout';
import { Emoji, Text } from '../../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const Container = styled(ColumnWithMargins).attrs({
  align: 'center',
  margin: 8,
})`
  ${padding(30, 42, 24)};
`;

const Heading = styled(Text).attrs(({ weight = 'bold' }) => ({
  size: 'larger',
  weight,
}))``;

const Message = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 22,
  size: 'smedium',
  weight: 'semibold',
}))``;

export default function SwapDetailsSlippageMessage({
  isHighPriceImpact,
  priceImpactColor,
  priceImpactNativeAmount,
  priceImpactPercentDisplay,
  ...props
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const headingValue = priceImpactNativeAmount ?? priceImpactPercentDisplay;
  return isHighPriceImpact ? (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column align="center" {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Container>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row align="center">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Heading color={priceImpactColor}>Losing </Heading>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Heading
            color={priceImpactColor}
            letterSpacing="roundedTight"
            weight="heavy"
          >
            {headingValue}
          </Heading>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Emoji size="larger"> 🥵</Emoji>
        </Row>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Message>
          This is a small market, so you’re getting a bad price. Try a smaller
          trade!
        </Message>
      </Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered width={139}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Divider color={colors.rowDividerExtraLight} inset={false} />
      </Centered>
    </Column>
  ) : null;
}
