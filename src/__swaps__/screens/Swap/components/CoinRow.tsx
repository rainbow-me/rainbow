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
import { userAssetsStore } from '@/state/assets/userAssets';
import { Hex } from 'viem';
import { UniqueId } from '@/__swaps__/types/assets';

export const CoinRow = ({ assetId, output, onPress }: { assetId: string; output?: boolean; onPress: (assetId: UniqueId) => void }) => {
  const theme = useTheme();

  console.log(output, assetId);

  const asset = userAssetsStore(state => state.getUserAsset(assetId));
  const isFavorited = userAssetsStore(state => state.isFavorite(asset.address));
  const toggleFavorite = userAssetsStore(state => state.toggleFavorite);
  // chainId={item.chainId}
  // color={item.colors?.primary ?? item.colors?.fallback}
  // iconUrl={item.icon_url}
  // address={item.address}
  // mainnetAddress={item.mainnetAddress}
  // balance={item.balance.display}
  // name={item.name}
  // onPress={() => handleSelectToken(item)}
  // nativeBalance={item.native.balance.display}
  // symbol={item.symbol}

  const isTrending = false;

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
    <ButtonPressAnimation disallowInterruption onPress={() => onPress(assetId)} scaleTo={0.95}>
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
              iconUrl={asset.icon_url}
              address={asset.address}
              mainnetAddress={asset.mainnetAddress}
              large
              network={ethereumUtils.getNetworkFromChainId(asset.chainId)}
              symbol={asset.symbol}
              theme={theme}
              color={asset.colors?.primary ?? asset.colors?.fallback}
            />
            <Stack space="10px">
              <Text color="label" size="17pt" weight="semibold">
                {asset.name}
              </Text>
              <Inline alignVertical="center" space={{ custom: 5 }}>
                <Text color="labelTertiary" size="13pt" weight="semibold">
                  {output ? asset.symbol : `${asset.balance.display}`}
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
                onPress={() => toggleFavorite(asset.address)}
                icon="􀋃"
                weight="black"
              />
            </Inline>
          ) : (
            <BalancePill balance={asset.native.balance.display} /> // needs fixing
          )}
        </Box>
      </HitSlop>
    </ButtonPressAnimation>
  );
};
