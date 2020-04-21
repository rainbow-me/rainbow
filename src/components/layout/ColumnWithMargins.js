import React from 'react';
import LayoutWithMargins from './LayoutWithMargins';

const ColumnWithMargins = ({ margin = 20, ...props }, ref) => (
  <LayoutWithMargins
    direction="column"
    margin={margin}
    marginKey="marginBottom"
    ref={ref}
    {...props}
  />
);

export default React.forwardRef(ColumnWithMargins);
