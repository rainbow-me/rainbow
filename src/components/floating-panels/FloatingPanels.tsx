import React from 'react';
import { ColumnWithMargins } from '../layout';
import { position } from '@rainbow-me/styles';

const FloatingPanelsMargin = 20;

const FloatingPanels = React.forwardRef(
  ({ margin = FloatingPanelsMargin, ...props }, ref) => (
    <ColumnWithMargins
      {...props}
      css={position.size('100%')}
      justify="center"
      margin={margin}
      pointerEvents="box-none"
      ref={ref}
    />
  )
);

FloatingPanels.displayName = 'FloatingPanels';

FloatingPanels.margin = FloatingPanelsMargin;

export default FloatingPanels;
