import { opacity } from '@/__swaps__/utils/swaps';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { Box } from '@/design-system/components/Box/Box';
import { useBackgroundColor } from '@/design-system/components/BackgroundProvider/BackgroundProvider';

export function PerpsTextSkeleton({ height, width }: { height: number; width: number }) {
  const skeletonColor = useBackgroundColor('fillQuaternary');
  const shimmerColor = opacity(useBackgroundColor('fillSecondary'), 0.1);
  return (
    <Box height={{ custom: height }} width={{ custom: width }}>
      <Skeleton skeletonColor={skeletonColor} shimmerColor={shimmerColor}>
        <FakeText height={height} width={width} />
      </Skeleton>
    </Box>
  );
}
