import * as React from 'react';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { Box } from '@/design-system';
import { AnimatedNumber } from '@/components/live-token-text/AnimatedNumber';

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
        // TODO: Arbitrary negative margin to account for the padding in the animated number, which is font size dependent
        <Box height={ProfileBalanceRowHeight} marginTop={{ custom: -12 }}>
          <AnimatedNumber value={totalValue} tabularNumbers color="label" size={totalValue?.length > 14 ? '26pt' : '34pt'} weight="heavy" />
        </Box>
      )}
    </>
  );
}
