import * as React from 'react';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { Box, useBackgroundColor } from '@/design-system';
import { AnimatedNumber } from '@/components/animated-number/AnimatedNumber';
import { useLiveWalletBalance } from '@/hooks/useLiveWalletBalance';

export const ProfileBalanceRowHeight = 24;
const placeholderHeight = ProfileBalanceRowHeight;
const placeholderWidth = 200;

export const ProfileBalanceRow = React.memo(function ProfileBalanceRow() {
  const backgroundColor = useBackgroundColor('surfacePrimary');
  const balance = useLiveWalletBalance();

  return (
    <>
      {balance === null ? (
        <Box height={{ custom: placeholderHeight }} width={{ custom: placeholderWidth }}>
          <Skeleton>
            <FakeText height={placeholderHeight} width={placeholderWidth} />
          </Skeleton>
        </Box>
      ) : (
        <Box paddingHorizontal={'36px'} width="full" style={{ alignItems: 'center' }} height={ProfileBalanceRowHeight}>
          <AnimatedNumber
            value={balance}
            color="label"
            align="center"
            easingMaskColor={backgroundColor}
            size={balance.length > 14 ? '26pt' : '34pt'}
            weight="heavy"
          />
        </Box>
      )}
    </>
  );
});
