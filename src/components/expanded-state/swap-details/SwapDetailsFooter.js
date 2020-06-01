import React from 'react';
import { neverRerender } from '../../../utils';
import { Row, RowWithMargins } from '../../layout';
import { Emoji, Text } from '../../text';

const SwapDetailsFooter = () => (
  <Row align="center" justify="space-between">
    <Text size="lmedium">Exchange</Text>
    <RowWithMargins align="center" margin={2}>
      <Emoji lineHeight="none" name="unicorn" size="lmedium" weight="medium" />
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

export default neverRerender(SwapDetailsFooter);
