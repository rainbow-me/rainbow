import React from 'react';
import { ColumnWithMargins } from '../layout';
import { position } from '@rainbow-me/styles';

const FloatingPanelsMargin = 20;

const css = position.sizeAsObject('100%');

const FloatingPanels = React.forwardRef(
  ({ margin = FloatingPanelsMargin, ...props }, ref) => (
    <ColumnWithMargins
      {...props}
      css={css}
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
