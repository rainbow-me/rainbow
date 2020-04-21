import React from 'react';
import LayoutWithDividers from './LayoutWithDividers';

const ColumnWithDividers = (props, ref) => (
  <LayoutWithDividers
    direction="column"
    dividerHorizontal
    ref={ref}
    {...props}
  />
);

export default React.forwardRef(ColumnWithDividers);
