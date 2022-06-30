import React from 'react';
import { Column } from '../layout';

const ExchangeFloatingPanels = React.forwardRef(({ ...props }, ref) => (
  <Column
    {...props}
    justify="center"
    pointerEvents="box-none"
    ref={ref}
    style={props.style}
  />
));

ExchangeFloatingPanels.displayName = 'ExchangeFloatingPanels';

export default ExchangeFloatingPanels;
