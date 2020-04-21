import React from 'react';
import LayoutWithMargins from './LayoutWithMargins';

const RowWithMargins = ({ margin = 19, ...props }, ref) => (
  <LayoutWithMargins
    {...props}
    direction="row"
    margin={margin}
    marginKey="marginRight"
    ref={ref}
  />
);

export default React.forwardRef(RowWithMargins);
