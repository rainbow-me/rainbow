import React from 'react';
import styled from 'styled-components';
import Divider from '../../Divider';
import { Centered, Column, ColumnWithMargins, Row } from '../../layout';
import { Emoji, Text } from '../../text';
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
}) {
  const { colors } = useTheme();
  const headingValue = priceImpactNativeAmount ?? priceImpactPercentDisplay;
  return isHighPriceImpact ? (
    <Column align="center" {...props}>
      <Container>
        <Row align="center">
          <Heading color={priceImpactColor}>Losing </Heading>
          <Heading
            color={priceImpactColor}
            letterSpacing="roundedTight"
            weight="heavy"
          >
            {headingValue}
          </Heading>
          <Emoji size="larger"> 🥵</Emoji>
        </Row>
        <Message>
          This is a small market, so you’re getting a bad price. Try a smaller
          trade!
        </Message>
      </Container>
      <Centered width={139}>
        <Divider color={colors.rowDividerExtraLight} inset={false} />
      </Centered>
    </Column>
  ) : null;
}
