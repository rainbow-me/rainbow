import * as React from 'react';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { Box, Text } from '@/design-system';

export const ProfileBalanceRowHeight = 24;
const placeholderHeight = ProfileBalanceRowHeight;
const placeholderWidth = 200;

type ProfileBalanceRowProps = {
  totalValue: string;
  isLoadingBalance: boolean;
};

export function ProfileBalanceRow({ totalValue, isLoadingBalance }: ProfileBalanceRowProps) {
  return (
    <>
      {isLoadingBalance ? (
        <Box height={{ custom: placeholderHeight }} width={{ custom: placeholderWidth }}>
          <Skeleton>
            <FakeText height={placeholderHeight} width={placeholderWidth} />
          </Skeleton>
        </Box>
      ) : (
        <Text testID="balance-text" numberOfLines={1} color="label" size={totalValue?.length > 14 ? '26pt' : '34pt'} weight="heavy">
          {totalValue}
        </Text>
      )}
    </>
  );
}
