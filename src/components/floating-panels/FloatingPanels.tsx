import React from 'react';
import { ColumnWithMargins } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const FloatingPanelsMargin = 20;

const FloatingPanels = React.forwardRef(
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'margin' does not exist on type '{ childr... Remove this comment to see the full error message
  ({ margin = FloatingPanelsMargin, ...props }, ref) => (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'margin' does not exist on type 'ForwardR... Remove this comment to see the full error message
FloatingPanels.margin = FloatingPanelsMargin;

export default FloatingPanels;
