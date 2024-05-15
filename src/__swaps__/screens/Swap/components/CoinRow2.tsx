import React, { useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, HitSlop, Inline, Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { CoinRowButton } from '@/__swaps__/screens/Swap/components/CoinRowButton';
import { BalancePill } from '@/__swaps__/screens/Swap/components/BalancePill';
import Animated from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { UniqueId } from '@/__swaps__/types/assets';
import { userAssetsStore } from '@/state/assets/userAssets';

export const CoinRow2 = ({ assetId, output, onPress }: { assetId: string; output?: boolean; onPress: (assetId: UniqueId) => void }) => {
  const { AnimatedSwapStyles } = useSwapContext();

  const asset = userAssetsStore(state => state.getUserAsset(assetId));
  const isFavorited = userAssetsStore(state => state.isFavorite(asset.address));
  const toggleFavorite = userAssetsStore(state => state.toggleFavorite);

  const isTrending = false; // fix this when implementing token to sell list

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
            {/* TODO: Implement Coin Icons using reanimated values */}
            <Box
              as={Animated.View}
              borderRadius={18}
              height={{ custom: 36 }}
              style={[styles.solidColorCoinIcon, AnimatedSwapStyles.assetToSellIconStyle]}
              width={{ custom: 36 }}
            />
            {/* <SwapCoinIcon
              iconUrl={iconUrl}
              address={address}
              mainnetAddress={mainnetAddress}
              large
              network={ethereumUtils.getNetworkFromChainId(chainId)}
              symbol={symbol}
              theme={theme}
              color={color}
            /> */}
            <Stack space="10px">
              <Text color="label" size="17pt" weight="semibold">
                {asset.name}
              </Text>
              <Inline alignVertical="center" space={{ custom: 5 }}>
                <Text color="labelTertiary" size="13pt" weight="semibold">
                  {output ? asset.symbol : `${asset.balance}`}
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
            <BalancePill balance={asset.native.balance.display} />
          )}
        </Box>
      </HitSlop>
    </ButtonPressAnimation>
  );
};

export const styles = StyleSheet.create({
  solidColorCoinIcon: {
    opacity: 0.4,
  },
});
