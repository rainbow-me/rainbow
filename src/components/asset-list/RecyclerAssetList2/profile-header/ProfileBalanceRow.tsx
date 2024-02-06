import * as React from 'react';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { Box, Heading } from '@/design-system';

export const ProfileBalanceRowHeight = 24;

export function ProfileBalanceRow({ totalValue, isLoadingUserAssets }: { totalValue: string; isLoadingUserAssets: boolean }) {
  const placeholderHeight = ProfileBalanceRowHeight;
  const placeholderWidth = 200;

  return (
    <>
      {isLoadingUserAssets ? (
        <Box height={{ custom: placeholderHeight }} width={{ custom: placeholderWidth }}>
          <Skeleton>
            <FakeText height={placeholderHeight} width={placeholderWidth} />
          </Skeleton>
        </Box>
      ) : (
        <Heading
          color="label"
          numberOfLines={1}
          size={totalValue?.length > 14 ? '26px / 30px (Deprecated)' : '34px / 41px (Deprecated)'}
          weight="heavy"
          testID="balance-text"
        >
          {totalValue}
        </Heading>
      )}
    </>
  );
}
