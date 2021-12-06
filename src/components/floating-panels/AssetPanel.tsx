import React from 'react';
import { ColumnWithDividers } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './FloatingPanel' was resolved to '/Users/n... Remove this comment to see the full error message
import FloatingPanel from './FloatingPanel';

export default function AssetPanel({
  children,
  dividerRenderer,
  ...props
}: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FloatingPanel {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ColumnWithDividers dividerRenderer={dividerRenderer}>
        {children}
      </ColumnWithDividers>
    </FloatingPanel>
  );
}
