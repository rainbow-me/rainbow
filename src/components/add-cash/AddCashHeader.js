import React from 'react';
import { withNeverRerender } from '../../hoc';
import { colors, padding } from '../../styles';
import { ColumnWithMargins } from '../layout';
import { SheetHandle } from '../sheet';
import { Text } from '../text';

const AddCashHeader = () => (
  <ColumnWithMargins align="center" css={padding(8, 0)} margin={1}>
    <SheetHandle />
    <Text
      align="center"
      css={{ paddingTop: 5 }}
      letterSpacing="tighter"
      lineHeight="loose"
      size="large"
      weight="bold"
    >
      Add Cash
    </Text>
    <Text
      align="center"
      color={colors.alpha(colors.blueGreyDark, 0.5)}
      family="SFProRounded"
      letterSpacing="looseyGoosey"
      lineHeight="loose"
      size="smedium"
      style={{ textTransform: 'uppercase' }}
      weight="semibold"
    >
      Up to $1500
    </Text>
  </ColumnWithMargins>
);

export default withNeverRerender(AddCashHeader);
