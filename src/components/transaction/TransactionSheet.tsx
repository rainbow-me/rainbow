import React from 'react';
import { Column } from '../layout';

const TransactionSheet = ({ children, ...props }: any) => {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column {...props} paddingHorizontal={30}>
      {children}
    </Column>
  );
};

export default TransactionSheet;
