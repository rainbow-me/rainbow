import React from 'react';
import { withNeverRerender } from '../../hoc';
import { padding } from '../../styles';
import { ColumnWithMargins } from '../layout';
import { SheetHandle } from '../sheet';
import { Text } from '../text';

const ExchangeModalHeader = () => (
  <ColumnWithMargins
    align="center"
    css={padding(9, 0)}
    margin={6}
  >
    <SheetHandle />
    <Text
      letterSpacing="tighter"
      lineHeight="loose"
      size="large"
      weight="bold"
    >
      Swap
    </Text>
  </ColumnWithMargins>
);

export default withNeverRerender(ExchangeModalHeader);
