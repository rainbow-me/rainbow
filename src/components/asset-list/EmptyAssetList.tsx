import React from 'react';
import { type ViewProps } from 'react-native';

import styled from '@/framework/ui/styled-thing';
import { times } from '@/helpers/utilities';
import { position } from '@/styles';

import { Centered, Column } from '../layout';
import { navbarHeight } from '../navbar/Navbar';
import AssetListItemSkeleton from './AssetListItemSkeleton';

const Container = styled(Column)({
  ...position.sizeAsObject('100%'),
  paddingTop: navbarHeight,
});

export interface EmptyAssetListProps extends ViewProps {
  descendingOpacity?: boolean;
  skeletonCount?: number;
  children?: React.ReactNode;
}

export const EmptyAssetList = ({ descendingOpacity, skeletonCount = 5, ...props }: EmptyAssetListProps) => (
  <Container {...props}>
    <Centered flex={1}>
      <Column cover>
        {times(skeletonCount, index => (
          <AssetListItemSkeleton animated descendingOpacity={descendingOpacity} index={index} key={`skeleton${index}`} />
        ))}
      </Column>
    </Centered>
  </Container>
);
