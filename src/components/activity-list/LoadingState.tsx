import React from 'react';

import { times } from '@/helpers/utilities';

import AssetListItemSkeleton from '../asset-list/AssetListItemSkeleton';
import { Column } from '../layout';

type LoadingStateProps = {
  children: React.ReactNode;
};

const LoadingState = ({ children }: LoadingStateProps) => (
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
