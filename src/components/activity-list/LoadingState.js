import { times } from 'lodash';
import React from 'react';
import { AssetListItemSkeleton } from '../asset-list';
import { Column } from '../layout';

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
