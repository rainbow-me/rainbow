import React, { useMemo, useState } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, HitSlop, Inline, Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { useTheme } from '@/theme';
import { SwapCoinIcon } from '@/__swaps__/screens/Swap/components/SwapCoinIcon';
import { CoinRowButton } from '@/__swaps__/screens/Swap/components/CoinRowButton';
import { BalancePill } from '@/__swaps__/screens/Swap/components/BalancePill';
import { ChainId } from '@/__swaps__/types/chains';
import { ethereumUtils } from '@/utils';
import { isFavorite, toggleFavorite } from '@/resources/favorites';
import { ETH_ADDRESS } from '@/references';
import { AddressZero } from '@ethersproject/constants';

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

  const [isFavorited, setIsFavorited] = useState<boolean>(isFavorite(address));

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
    <ButtonPressAnimation disallowInterruption onPress={onPress} scaleTo={0.95}>
      <HitSlop vertical="10px">
        <Box
          alignItems="center"
          paddingVertical={'10px'}
          paddingHorizontal={'20px'}
          flexDirection="row"
          justifyContent="space-between"
          width="full"
        >
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
              <CoinRowButton
                color={isFavorited ? '#FFCB0F' : undefined}
                onPress={async () => {
                  setIsFavorited(await toggleFavorite(address === AddressZero ? ETH_ADDRESS : address));
                }}
                icon="􀋃"
                weight="black"
              />
            </Inline>
          ) : (
            <BalancePill balance={nativeBalance} />
          )}
        </Box>
      </HitSlop>
    </ButtonPressAnimation>
  );
};
