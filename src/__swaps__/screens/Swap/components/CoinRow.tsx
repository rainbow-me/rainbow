import React, { useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, HitSlop, Inline, Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { useTheme } from '@/theme';
import { SwapCoinIcon } from './SwapCoinIcon';
import { CoinRowButton } from './CoinRowButton';
import { BalancePill } from './BalancePill';
import { ChainId } from '../types/chains';
import { ethereumUtils } from '@/utils';

export const CoinRow = ({
  address,
  mainnetAddress,
  chainId,
  balance,
  isTrending,
  name,
  nativeBalance,
  color,
  iconUrl,
  onPress,
  output,
  symbol,
}: {
  address: string;
  mainnetAddress: string;
  chainId: ChainId;
  balance: string;
  isTrending?: boolean;
  name: string;
  nativeBalance: string;
  color: string | undefined;
  iconUrl: string | undefined;
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
            <SwapCoinIcon
              iconUrl={iconUrl}
              address={address}
              mainnetAddress={mainnetAddress}
              large
              network={ethereumUtils.getNetworkFromChainId(chainId)}
              symbol={symbol}
              theme={theme}
              color={color}
            />
            <Stack space="10px">
              <Text color="label" size="17pt" weight="semibold">
                {name}
              </Text>
              <Inline alignVertical="center" space={{ custom: 5 }}>
                <Text color="labelTertiary" size="13pt" weight="semibold">
                  {output ? symbol : `${balance}`}
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
