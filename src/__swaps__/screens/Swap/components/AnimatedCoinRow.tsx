import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { AnimatedText, Box, HitSlop, Inline, Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { useTheme } from '@/theme';
import { SwapCoinIcon } from '@/__swaps__/screens/Swap/components/SwapCoinIcon';
import { CoinRowButton } from '@/__swaps__/screens/Swap/components/CoinRowButton';
import { BalancePill } from '@/__swaps__/screens/Swap/components/BalancePill';
import { ChainId } from '@/__swaps__/types/chains';
import { ethereumUtils } from '@/utils';
import { isFavorite, toggleFavorite, useFavorites } from '@/resources/favorites';
import { ETH_ADDRESS } from '@/references';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { SearchAsset } from '@/__swaps__/types/search';
import { View } from 'react-native';
import { AddressZero } from '@ethersproject/constants';
import { AnimatedSwapCoinIcon } from './AnimatedSwapCoinIcon';
import { Network } from '@/networks/types';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { TokenColors } from '@/graphql/__generated__/metadata';
import AnimatedRainbowCoinIcon from '@/components/coin-icon/AnimatedRainbowCoinIcon';

export const AnimatedCoinRow = ({
  sectionData,
  index,
  onPress,
  output,
}: {
  sectionData: SharedValue<SearchAsset[]>;
  index: number;
  onPress: (asset: SearchAsset) => void;
  output?: boolean;
}) => {
  const theme = useTheme();
  // const { favoritesMetadata } = useFavorites();
  // console.log('🚨🚨🚨🚨🚨🚨 coin row render 🚨🚨🚨🚨🚨🚨');
  // const favorites = Object.values(favoritesMetadata);

  // const isFavorite = (address: string) => {
  //   return favorites.find(fav =>
  //     fav.address === ETH_ADDRESS ? '0x0000000000000000000000000000000000000000' === address : fav.address === address
  //   );
  // };

  const asset: Readonly<SharedValue<SearchAsset | undefined>> = useDerivedValue(() => sectionData.value?.[index]);
  const name: Readonly<SharedValue<string | undefined>> = useDerivedValue(() => asset.value?.name);
  const symbol: Readonly<SharedValue<string | undefined>> = useDerivedValue(() => asset.value?.symbol);
  const address: Readonly<SharedValue<string | undefined>> = useDerivedValue(() => asset.value?.address);
  const iconUrl: Readonly<SharedValue<string | undefined>> = useDerivedValue(() => asset.value?.icon_url);
  const chainId: Readonly<SharedValue<ChainId | undefined>> = useDerivedValue(() => asset.value?.chainId);
  const network: Readonly<SharedValue<Network | undefined>> = useDerivedValue(
    () => chainId.value && ethereumUtils.getNetworkFromChainId(chainId.value)
  );
  const color: Readonly<SharedValue<string | undefined>> = useDerivedValue(
    () => asset.value?.colors?.primary ?? asset.value?.colors?.fallback
  );
  const mainnetAddress: Readonly<SharedValue<string | undefined>> = useDerivedValue(() => asset.value?.mainnetAddress);

  const isFavorited: SharedValue<boolean> = useSharedValue(address.value ? isFavorite(address.value) : false);

  const updateFavorite = useCallback(() => {
    if (address.value) {
      isFavorited.value = isFavorite(address.value === AddressZero ? ETH_ADDRESS : address.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useAnimatedReaction(
    () => address.value,
    (current, previous) => {
      if (current && current !== previous) {
        runOnJS(updateFavorite)();
      }
    }
  );

  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current = renderCount.current + 1;
    console.log(`Rendered ${symbol.value} ${renderCount.current} times`);
  });

  const isTrending = false;

  const percentChange = useDerivedValue(() => {
    if (isTrending) {
      const rawChange = Math.random() * 30;
      const isNegative = Math.random() < 0.2;
      const prefix = isNegative ? '-' : '+';
      const color: TextColor = isNegative ? 'red' : 'green';
      const change = `${rawChange.toFixed(1)}%`;

      return { change, color, prefix };
    }
  });
  const percentChangeChange = useDerivedValue(() => percentChange?.value?.change);
  const percentChangeColor = useDerivedValue(() => percentChange?.value?.color);
  const percentChangePrefix = useDerivedValue(() => percentChange?.value?.prefix);

  const percentChangeContainerAnimatedStyle = useAnimatedStyle(() => ({ display: percentChange.value ? 'flex' : 'none' }));
  const percentChangeAnimatedStyle = useAnimatedStyle(() => ({ color: percentChangeColor.value }));

  const animatedStyle = useAnimatedStyle(() => ({ display: asset.value ? 'flex' : 'none' }));
  const favoriteButtonColor = useDerivedValue(() => {
    console.log(isFavorited.value);
    return isFavorited.value ? '#FFCB0F' : undefined;
  });

  return (
    <Animated.View style={animatedStyle}>
      <ButtonPressAnimation disallowInterruption onPress={() => asset.value && onPress(asset.value)} scaleTo={0.95}>
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
              <AnimatedSwapCoinIcon
                iconUrl={iconUrl}
                address={address}
                mainnetAddress={mainnetAddress}
                large
                network={network}
                symbol={symbol}
                theme={theme}
                color={color}
              />
              <Stack space="10px">
                <AnimatedText color="label" size="17pt" weight="semibold">
                  {name}
                </AnimatedText>
                <Inline alignVertical="center" space={{ custom: 5 }}>
                  <AnimatedText color="labelTertiary" size="13pt" weight="semibold">
                    {/* {output ? symbol : `${balance}`} */}
                    {symbol}
                  </AnimatedText>
                  <Animated.View style={percentChangeContainerAnimatedStyle}>
                    <Inline alignVertical="center" space={{ custom: 1 }}>
                      <AnimatedText align="center" style={percentChangeAnimatedStyle} size="12pt" weight="bold">
                        {percentChangePrefix}
                      </AnimatedText>
                      <AnimatedText style={percentChangeAnimatedStyle} size="13pt" weight="semibold">
                        {percentChangeChange}
                      </AnimatedText>
                    </Inline>
                  </Animated.View>
                </Inline>
              </Stack>
            </Inline>
            {output ? (
              <Inline space="8px">
                <CoinRowButton icon="􀅳" outline size="icon 14px" />
                <CoinRowButton
                  color={favoriteButtonColor}
                  onPress={async () => {
                    if (!address.value) return;
                    isFavorited.value = await toggleFavorite(address.value === AddressZero ? ETH_ADDRESS : address.value);
                  }}
                  icon="􀋃"
                  weight="black"
                />
              </Inline>
            ) : (
              <BalancePill balance={''} />
            )}
          </Box>
        </HitSlop>
      </ButtonPressAnimation>
    </Animated.View>
  );
};
