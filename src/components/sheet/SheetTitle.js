import React from 'react';
import { Rounded } from '../text';

const SheetTitle = props => (
  <Rounded
    align="center"
    letterSpacing="looseyGoosey"
    lineHeight="loose"
    size="large"
    weight="bold"
    {...props}
  />
);

export default SheetTitle;
