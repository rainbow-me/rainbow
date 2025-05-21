import * as React from 'react';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { Box } from '@/design-system';
import { AnimatedNumber } from '@/components/live-token-text/AnimatedNumber';
import { useLiveWalletBalance } from '@/hooks/useLiveWalletBalance';
import useAccountSettings from '@/hooks/useAccountSettings';

export const ProfileBalanceRowHeight = 24;
const placeholderHeight = ProfileBalanceRowHeight;
const placeholderWidth = 200;

export function ProfileBalanceRow() {
  const { accountAddress } = useAccountSettings();
  const { balances, isLoading } = useLiveWalletBalance(accountAddress);
  const totalBalance = balances.totalBalance.display;

  return (
    <>
      {isLoading ? (
        <Box height={{ custom: placeholderHeight }} width={{ custom: placeholderWidth }}>
          <Skeleton>
            <FakeText height={placeholderHeight} width={placeholderWidth} />
          </Skeleton>
        </Box>
      ) : (
        // TODO: Arbitrary negative margin to account for the padding in the animated number, which is font size dependent
        <Box height={ProfileBalanceRowHeight} marginTop={{ custom: -12 }}>
          <AnimatedNumber
            value={totalBalance}
            tabularNumbers
            color="label"
            size={totalBalance?.length > 14 ? '26pt' : '34pt'}
            weight="heavy"
          />
        </Box>
      )}
    </>
  );
}
