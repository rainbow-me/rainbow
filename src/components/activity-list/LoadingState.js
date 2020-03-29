import { times } from 'lodash';
import React from 'react';
import { Column } from '../layout';
import { AssetListItemSkeleton } from '../asset-list';

const LoadingState = ({ children }) => (
  <Column flex={1}>
    {children}
    <Column flex={1}>
      {times(11, index => (
        <AssetListItemSkeleton key={`activitySkeleton${index}`} />
      ))}
    </Column>
  </Column>
);

export default LoadingState;
