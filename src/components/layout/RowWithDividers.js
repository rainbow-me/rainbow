import React from 'react';
import LayoutWithDividers from './LayoutWithDividers';

const RowWithDividers = (props, ref) => (
  <LayoutWithDividers
    direction="row"
    dividerHorizontal={false}
    ref={ref}
    {...props}
  />
);

export default React.forwardRef(RowWithDividers);
