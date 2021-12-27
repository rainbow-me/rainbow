import { times } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { Centered, Column } from '../layout';
import AssetListHeader from './AssetListHeader';
import AssetListItemSkeleton from './AssetListItemSkeleton';
import { position } from '@rainbow-me/styles';

const Container = styled(Column)`
  ${position.size('100%')};
`;

const AssetListSkeleton = ({
  descendingOpacity,
  skeletonCount = 5,
  title,
  ...props
}) => {
  return (
    <Container {...props}>
      <Centered flex={1}>
        {title && <AssetListHeader title={title} />}
        <Column cover>
          {times(skeletonCount, index => (
            <AssetListItemSkeleton
              animated
              descendingOpacity={descendingOpacity}
              index={index}
              key={`skeleton${index}`}
            />
          ))}
        </Column>
      </Centered>
    </Container>
  );
};

export default React.memo(AssetListSkeleton);
