import React from 'react';
import { Row, RowWithMargins } from '../../layout';
import { Emoji, Text } from '../../text';

export default function SwapDetailsFooter() {
  return (
    <Row align="center" justify="space-between">
      <Text size="lmedium">Exchange</Text>
      <RowWithMargins align="center" margin={2}>
        <Emoji
          lineHeight="none"
          name="unicorn"
          size="lmedium"
          weight="medium"
        />
        <Text
          align="right"
          color="flamingo"
          letterSpacing="roundedTight"
          size="lmedium"
          weight="semibold"
        >
          Uniswap
        </Text>
      </RowWithMargins>
    </Row>
  );
}
