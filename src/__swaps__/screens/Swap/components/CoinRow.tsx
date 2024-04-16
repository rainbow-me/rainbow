import React, { useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, HitSlop, Inline, Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { useTheme } from '@/theme';
import { SwapCoinIcon } from '@/__swaps__/screens/Swap/components/SwapCoinIcon';
import { CoinRowButton } from '@/__swaps__/screens/Swap/components/CoinRowButton';
import { BalancePill } from '@/__swaps__/screens/Swap/components/BalancePill';
import { ChainId } from '@/__swaps__/types/chains';
import { ethereumUtils } from '@/utils';
import { toggleFavorite, useFavorites } from '@/resources/favorites';
import { ETH_ADDRESS } from '@/references';
import { TokenColors } from '@/graphql/__generated__/metadata';

export const CoinRow = ({
  address,
  colors,
  chainId,
  balance,
  isTrending,
  name,
  nativeBalance,
  iconUrl,
  onPress,
  output,
  symbol,
}: {
  address: string;
  chainId: ChainId;
  balance: string;
  isTrending?: boolean;
  name: string;
  nativeBalance: string;
  colors: TokenColors;
  iconUrl: string | undefined;
  onPress?: () => void;
  output?: boolean;
  symbol: string;
}) => {
  const theme = useTheme();
  const { favoritesMetadata } = useFavorites();

  const favorites = Object.values(favoritesMetadata);

  const isFavorite = (address: string) => {
    return favorites.find(fav =>
      fav.address === ETH_ADDRESS ? '0x0000000000000000000000000000000000000000' === address : fav.address === address
    );
  };

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
            <SwapCoinIcon iconUrl={iconUrl} large chainId={chainId} symbol={symbol} theme={theme} colors={colors} />
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
                color={isFavorite(address) ? '#FFCB0F' : undefined}
                onPress={() => toggleFavorite(address)}
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
