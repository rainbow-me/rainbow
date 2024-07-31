import React, { PropsWithChildren } from 'react';
import { AssetListItemSkeleton } from '@/components/asset-list';
import { Column } from '@/components/layout';
import { times } from '@/helpers/utilities';

const NFTLoadingSkeleton = ({ items = 5 }) => (
  <Column flex={1}>
    <Column flex={1}>
      {times(items, index => (
        <AssetListItemSkeleton key={`activitySkeleton${index}`} />
      ))}
    </Column>
  </Column>
);

export default LoadingState;
