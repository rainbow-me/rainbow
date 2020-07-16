import React from 'react';
import { ColumnWithDividers } from '../layout';
import FloatingPanel from './FloatingPanel';

export default function AssetPanel({ children, ...props }) {
  return (
    <FloatingPanel {...props}>
      <ColumnWithDividers>{children}</ColumnWithDividers>
    </FloatingPanel>
  );
}
