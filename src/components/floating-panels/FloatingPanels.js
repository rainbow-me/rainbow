import React from 'react';

import { position } from '@/styles';

import { ColumnWithMargins } from '../layout';

const FloatingPanelsMargin = 20;

const css = position.sizeAsObject('100%');

const FloatingPanels = React.forwardRef(({ margin = FloatingPanelsMargin, ...props }, ref) => (
  <ColumnWithMargins {...props} justify="center" margin={margin} pointerEvents="box-none" ref={ref} style={[css, props.style]} />
));

FloatingPanels.displayName = 'FloatingPanels';

FloatingPanels.margin = FloatingPanelsMargin;

export default FloatingPanels;
