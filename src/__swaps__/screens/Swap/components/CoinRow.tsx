import React, { useMemo } from 'react';
import { Address } from 'viem';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, HitSlop, Inline, Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { Network } from '@/networks/types';
import { useTheme } from '@/theme';
import { SwapCoinIcon } from './SwapCoinIcon';
import { CoinRowButton } from './CoinRowButton';
import { BalancePill } from './BalancePill';

export const CoinRow = ({
  address,
  balance,
  isTrending,
  name,
  nativeBalance,
  onPress,
  output,
  symbol,
}: {
  address: Address | 'eth';
  balance: string;
  isTrending?: boolean;
  name: string;
  nativeBalance: string;
  onPress?: () => void;
  output?: boolean;
  symbol: string;
}) => {
  const theme = useTheme();

  const percentChange = useMemo(() => {
    if (isTrending) {
      const rawChange = Math.random() * 30;
      const isNegative = Math.random() < 0.2;
      const prefix = isNegative ? '-' : '+';
      const color: TextColor = isNegative ? 'red' : 'green';
      const change = `${rawChange.toFixed(1)}%`;

      return { change, color, prefix };
    }
  }, [isTrending]);

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.95}>
      <HitSlop vertical="10px">
        <Box alignItems="center" flexDirection="row" justifyContent="space-between" width="full">
          <Inline alignVertical="center" space="10px">
            <SwapCoinIcon address={address} large network={Network.mainnet} symbol={symbol} theme={theme} />
            <Stack space="10px">
              <Text color="label" size="17pt" weight="semibold">
                {name}
              </Text>
              <Inline alignVertical="center" space={{ custom: 5 }}>
                <Text color="labelTertiary" size="13pt" weight="semibold">
                  {output ? symbol : `${balance} ${symbol}`}
                </Text>
                {isTrending && percentChange && (
                  <Inline alignVertical="center" space={{ custom: 1 }}>
                    <Text align="center" color={percentChange.color} size="12pt" weight="bold">
                      {percentChange.prefix}
                    </Text>
                    <Text color={percentChange.color} size="13pt" weight="semibold">
                      {percentChange.change}
                    </Text>
                  </Inline>
                )}
              </Inline>
            </Stack>
          </Inline>
          {output ? (
            <Inline space="8px">
              <CoinRowButton icon="􀅳" outline size="icon 14px" />
              <CoinRowButton icon="􀋃" weight="black" />
            </Inline>
          ) : (
            <BalancePill balance={nativeBalance} />
          )}
        </Box>
      </HitSlop>
    </ButtonPressAnimation>
  );
};
