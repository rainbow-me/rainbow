import React from 'react';
import { Column } from '../layout';

const TransactionSheet = ({ children, ...props }) => {
  return (
    <Column {...props} paddingHorizontal={30}>
      {children}
    </Column>
  );
};

export default TransactionSheet;
