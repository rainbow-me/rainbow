import { memo } from 'react';
import type { DimensionValue } from 'react-native';

import { Skeleton } from '@/components/Skeleton';
import { Box } from '@/design-system';

import { MembershipCard } from './MembershipCard';

type MembershipCardSkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
};

export const MembershipCardSkeleton = memo(function MembershipCardSkeleton({ width = '100%', height = 176 }: MembershipCardSkeletonProps) {
  return (
    <MembershipCard>
      <Box style={{ width, height }}>
        <Skeleton width="100%" height="100%" />
      </Box>
    </MembershipCard>
  );
});
