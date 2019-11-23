import React from 'react';
import { withNeverRerender } from '../../hoc';
import { colors, padding } from '../../styles';
import { ColumnWithMargins } from '../layout';
import { SheetHandle } from '../sheet';

const EmojiSheetHeader = () => (
  <ColumnWithMargins align="center" css={padding(8, 0)} margin={1}>
    <SheetHandle />
  </ColumnWithMargins>
);

export default withNeverRerender(EmojiSheetHeader);
