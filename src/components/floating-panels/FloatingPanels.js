import React from 'react';
import { ColumnWithMargins } from '../layout';
import { position } from '@/styles';

const FloatingPanelsMargin = 20;

const css = position.sizeAsObject('100%');

const FloatingPanels = React.forwardRef(({ margin = FloatingPanelsMargin, ...props }, ref) => (
  <ColumnWithMargins {...props} justify="center" margin={margin} pointerEvents="box-none" ref={ref} style={[css, props.style]} />
));

FloatingPanels.displayName = 'FloatingPanels';

FloatingPanels.margin = FloatingPanelsMargin;

export default FloatingPanels;
