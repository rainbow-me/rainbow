import React from 'react';

import { Box, Text } from '@/design-system';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { type SolanaBalance } from '@/features/solana/core/balances';

export function SolanaBalanceRow({ balance, currency }: { balance: SolanaBalance; currency: NativeCurrencyKey }) {
  return (
    <Box
      height={{ custom: 70 }}
      paddingHorizontal="20px"
      flexDirection="row"
      alignItems="center"
      gap={12}
      accessible
      accessibilityLabel={`${balance.name}, ${balance.amount} ${balance.rawUnits ? 'base units' : balance.symbol}, Solana`}
      testID={`solana-balance-${balance.assetId}`}
    >
      <Box
        width={{ custom: 40 }}
        height={{ custom: 40 }}
        borderRadius={20}
        background="fillSecondary"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="labelSecondary" size="17pt" weight="bold">
          {balance.symbol.slice(0, 1)}
        </Text>
      </Box>
      <Box flexShrink={1} flexGrow={1} gap={8}>
        <Text color="label" size="17pt" weight="semibold" numberOfLines={1}>
          {balance.name}
        </Text>
        <Text color="labelTertiary" size="13pt" weight="medium" numberOfLines={1}>
          {balance.amount} {balance.rawUnits ? 'base units' : balance.symbol}
        </Text>
      </Box>
      <Text color="labelSecondary" size="15pt" weight="semibold">
        {convertAmountToNativeDisplay(balance.value ?? '0', currency)}
      </Text>
    </Box>
  );
}

export function SolanaBalancesStatus({ message }: { message: string }) {
  return (
    <Box height={{ custom: 44 }} paddingHorizontal="20px" justifyContent="center" testID="solana-balances-status">
      <Text color="labelTertiary" size="13pt" weight="medium">
        {message}
      </Text>
    </Box>
  );
}
