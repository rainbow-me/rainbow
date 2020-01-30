import React from 'react';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import { withNeverRerender } from '../../hoc';
import { colors, padding } from '../../styles';
import { ColumnWithMargins } from '../layout';
import { SheetHandle } from '../sheet';
import { Text } from '../text';

const AddCashHeader = ({ limit }) => (
  <ColumnWithMargins
    align="center"
    css={padding(isNativeStackAvailable ? 6 : 8, 0)}
    margin={1}
  >
    <SheetHandle />
    <Text
      align="center"
      css={{ paddingTop: 5 }}
      family="SFProRounded"
      letterSpacing="looseyGoosey"
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
      letterSpacing="uppercase"
      lineHeight="loose"
      size="smedium"
      style={{ textTransform: 'uppercase' }}
      weight="semibold"
    >
      {`Up to $${limit}`}
    </Text>
  </ColumnWithMargins>
);

export default withNeverRerender(AddCashHeader);
