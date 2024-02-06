import React from 'react';
import { ColumnWithDividers } from '../layout';
import FloatingPanel from './FloatingPanel';

export default function AssetPanel({ children, dividerRenderer, ...props }) {
  return (
    <FloatingPanel {...props}>
      <ColumnWithDividers dividerRenderer={dividerRenderer}>{children}</ColumnWithDividers>
    </FloatingPanel>
  );
}
