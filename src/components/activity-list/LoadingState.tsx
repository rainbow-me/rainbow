import { times } from 'lodash';
import React from 'react';
import { AssetListItemSkeleton } from '../asset-list';
import { Column } from '../layout';

const LoadingState = ({ children }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Column flex={1}>
    {children}
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Column flex={1}>
      {times(11, index => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <AssetListItemSkeleton key={`activitySkeleton${index}`} />
      ))}
    </Column>
  </Column>
);

export default LoadingState;
