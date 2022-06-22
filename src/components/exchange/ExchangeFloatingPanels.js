import React from 'react';
import { Column } from '../layout';

const ExchangeFloatingPanels = React.forwardRef(
  ({ paddingTop = 24, ...props }, ref) => (
    <Column
      {...props}
      justify="center"
      paddingTop={paddingTop}
      pointerEvents="box-none"
      ref={ref}
      style={props.style}
    />
  )
);

ExchangeFloatingPanels.displayName = 'ExchangeFloatingPanels';

export default ExchangeFloatingPanels;
