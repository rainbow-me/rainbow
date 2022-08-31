import * as React from 'react';
import { useSelector } from 'react-redux';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { Box, Heading } from '@/design-system';
import { AppState } from '@/redux/store';

export const ProfileBalanceRowHeight = 24;

export function ProfileBalanceRow({ totalValue }: { totalValue: string }) {
  const isLoadingAssets = useSelector(
    (state: AppState) => state.data.isLoadingAssets
  );

  const placeholderHeight = ProfileBalanceRowHeight;
  const placeholderWidth = 200;

  return (
    <>
      {isLoadingAssets ? (
        <Box
          height={{ custom: placeholderHeight }}
          width={{ custom: placeholderWidth }}
        >
          <Skeleton>
            <FakeText height={placeholderHeight} width={placeholderWidth} />
          </Skeleton>
        </Box>
      ) : (
        <Heading
          numberOfLines={1}
          size={totalValue?.length > 14 ? '26px' : '34px'}
          weight="heavy"
        >
          {totalValue}
        </Heading>
      )}
    </>
  );
}
