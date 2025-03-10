import * as React from 'react';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { Box, Text } from '@/design-system';
import { useAccountSettings, useWallets, useWalletsWithBalancesAndNames } from '@/hooks';

export const ProfileBalanceRowHeight = 24;

export function ProfileBalance() {
  const placeholderHeight = ProfileBalanceRowHeight;
  const placeholderWidth = 200;

  const { accountAddress } = useAccountSettings();
  const { selectedWallet } = useWallets();

  const walletBalances = useWalletsWithBalancesAndNames();
  const accountWithBalance = walletBalances[selectedWallet.id]?.addresses.find(
    address => address.address.toLowerCase() === accountAddress.toLowerCase()
  )?.balancesMinusHiddenBalances;

  const balanceTextSize = React.useMemo(() => {
    if (typeof accountWithBalance === 'undefined') return '26pt';
    return accountWithBalance.length > 14 ? '26pt' : '34pt';
  }, [accountWithBalance]);

  return (
    <Box padding="12px">
      {typeof accountWithBalance === 'undefined' ? (
        <Box height={{ custom: placeholderHeight }} width={{ custom: placeholderWidth }}>
          <Skeleton>
            <FakeText height={placeholderHeight} width={placeholderWidth} />
          </Skeleton>
        </Box>
      ) : (
        <Text color="label" numberOfLines={1} size={balanceTextSize} weight="heavy" testID="balance-text">
          {accountWithBalance}
        </Text>
      )}
    </Box>
  );
}
