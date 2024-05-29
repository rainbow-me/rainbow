import React, { useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Column, Columns, HitSlop, Inline, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { CoinRowButton } from '@/__swaps__/screens/Swap/components/CoinRowButton';
import { BalancePill } from '@/__swaps__/screens/Swap/components/BalancePill';
import { ChainId } from '@/__swaps__/types/chains';
import { toggleFavorite, useFavorites } from '@/resources/favorites';
import { ETH_ADDRESS } from '@/references';
import Animated from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { SwapCoinIcon } from './SwapCoinIcon';
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
  const { AnimatedSwapStyles } = useSwapContext();
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
    <Box>
      <Columns alignVertical="center">
        <Column>
          <ButtonPressAnimation disallowInterruption onPress={onPress} scaleTo={0.95}>
            <HitSlop vertical="10px">
              <Box
                alignItems="center"
                paddingLeft="20px"
                paddingRight={!output ? '20px' : undefined}
                paddingVertical="10px"
                flexDirection="row"
                justifyContent="space-between"
                width="full"
                gap={12}
              >
                <Box flexDirection="row" gap={10} flexShrink={1} justifyContent="center">
                  <SwapCoinIcon
                    iconUrl={iconUrl}
                    address={address}
                    mainnetAddress={mainnetAddress}
                    large
                    network={ethereumUtils.getNetworkFromChainId(chainId)}
                    symbol={symbol}
                    color={color}
                  />
                  <Box gap={10} flexShrink={1} justifyContent="center">
                    <Text color="label" size="17pt" weight="semibold" numberOfLines={1} ellipsizeMode="tail">
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
                  </Box>
                </Box>
                {!output && <BalancePill balance={nativeBalance} />}
              </Box>
            </HitSlop>
          </ButtonPressAnimation>
        </Column>
        {output && (
          <Column width="content">
            <Box paddingLeft="12px" paddingRight="20px">
              <Inline space="8px">
                <CoinRowButton icon="􀅳" outline size="icon 14px" />
                <CoinRowButton
                  color={isFavorite(address) ? '#FFCB0F' : undefined}
                  onPress={() => toggleFavorite(address)}
                  icon="􀋃"
                  weight="black"
                />
              </Inline>
            </Box>
          </Column>
        )}
      </Columns>
    </Box>
  );
};

export const styles = StyleSheet.create({
  solidColorCoinIcon: {
    opacity: 0.4,
  },
});
