import * as React from 'react';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { Box, Text } from '@/design-system';
import { useAccountSettings, useWallets, useWalletsWithBalancesAndNames } from '@/hooks';
import { isZero } from '@/helpers/utilities';

export const ProfileBalanceRowHeight = 24;
export const ProfilePadding = 12;
export const ProfileBalanceTotalHeight = ProfileBalanceRowHeight + ProfilePadding * 2;

export function ProfileBalance() {
  const placeholderHeight = ProfileBalanceRowHeight;
  const placeholderWidth = 200;
  const { accountAddress, nativeCurrencySymbol } = useAccountSettings();
  const { selectedWallet } = useWallets();

  const walletBalances = useWalletsWithBalancesAndNames();
  const accountWithBalance = walletBalances[selectedWallet.id]?.addresses.find(
    address => address.address.toLowerCase() === accountAddress.toLowerCase()
  )?.balancesMinusHiddenBalances;

  const balanceTextSize = React.useMemo(() => {
    if (typeof accountWithBalance === 'undefined') return '26pt';
    return accountWithBalance.length > 14 ? '26pt' : '34pt';
  }, [accountWithBalance]);

  const isZeroBalance = React.useMemo(() => {
    if (typeof accountWithBalance === 'undefined') return false;
    return isZero(accountWithBalance.replace(nativeCurrencySymbol, ''));
  }, [accountWithBalance, nativeCurrencySymbol]);

  return (
    <Box padding={!isZeroBalance ? `${ProfilePadding}px` : undefined}>
      {typeof accountWithBalance === 'undefined' ? (
        <Box height={{ custom: placeholderHeight }} width={{ custom: placeholderWidth }}>
          <Skeleton>
            <FakeText height={placeholderHeight} width={placeholderWidth} />
          </Skeleton>
        </Box>
      ) : !isZeroBalance ? (
        <Text color="label" numberOfLines={1} size={balanceTextSize} weight="heavy" testID="balance-text">
          {accountWithBalance}
        </Text>
      ) : null}
    </Box>
  );
}
