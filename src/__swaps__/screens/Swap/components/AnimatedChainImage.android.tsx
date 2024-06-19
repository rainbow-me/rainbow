/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react';
import { StyleSheet, View } from 'react-native';

const ArbitrumBadge = require('@/assets/badges/arbitrum.png');
const BaseBadge = require('@/assets/badges/base.png');
const BscBadge = require('@/assets/badges/bsc.png');
const EthereumBadge = require('@/assets/badges/ethereum.png');
const OptimismBadge = require('@/assets/badges/optimism.png');
const PolygonBadge = require('@/assets/badges/polygon.png');
const ZoraBadge = require('@/assets/badges/zora.png');
const AvalancheBadge = require('@/assets/badges/avalanche.png');
const BlastBadge = require('@/assets/badges/blast.png');
const DegenBadge = require('@/assets/badges/degen.png');

import { ChainId } from '@/__swaps__/types/chains';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { AddressOrEth, ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { globalColors } from '@/design-system';
import { customChainIdsToAssetNames } from '@/__swaps__/utils/chains';
import { AddressZero } from '@ethersproject/constants';
import { ETH_ADDRESS } from '@/references';
import { PIXEL_RATIO } from '@/utils/deviceUtils';

const networkBadges = {
  [ChainId.mainnet]: EthereumBadge,
  [ChainId.polygon]: PolygonBadge,
  [ChainId.optimism]: OptimismBadge,
  [ChainId.arbitrum]: ArbitrumBadge,
  [ChainId.base]: BaseBadge,
  [ChainId.zora]: ZoraBadge,
  [ChainId.bsc]: BscBadge,
  [ChainId.avalanche]: AvalancheBadge,
  [ChainId.sepolia]: EthereumBadge,
  [ChainId.holesky]: EthereumBadge,
  [ChainId.optimismSepolia]: OptimismBadge,
  [ChainId.bscTestnet]: BscBadge,
  [ChainId.polygonAmoy]: PolygonBadge,
  [ChainId.arbitrumSepolia]: ArbitrumBadge,
  [ChainId.baseSepolia]: BaseBadge,
  [ChainId.zoraSepolia]: ZoraBadge,
  [ChainId.avalancheFuji]: AvalancheBadge,
  [ChainId.blast]: BlastBadge,
  [ChainId.blastSepolia]: BlastBadge,
  [ChainId.degen]: DegenBadge,
};

export const getCustomChainIconUrlWorklet = (chainId: ChainId, address: AddressOrEth) => {
  'worklet';

  if (!chainId || !customChainIdsToAssetNames[chainId]) return '';
  const baseUrl = 'https://raw.githubusercontent.com/rainbow-me/assets/master/blockchains/';

  if (address === AddressZero || address === ETH_ADDRESS) {
    return `${baseUrl}${customChainIdsToAssetNames[chainId]}/info/logo.png`;
  } else {
    return `${baseUrl}${customChainIdsToAssetNames[chainId]}/assets/${address}/logo.png`;
  }
};

export function AnimatedChainImage({
  asset,
  showMainnetBadge = false,
  size = 20,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  showMainnetBadge?: boolean;
  size?: number;
}) {
  const animatedIconSource = useAnimatedProps(() => {
    const base = {
      source: null,
      height: size,
      width: size,
      resizeMode: 'cover',
    };
    if (!asset?.value) {
      if (!showMainnetBadge) {
        return base;
      }

      base.source = networkBadges[ChainId.mainnet];
      return base;
    }

    if (networkBadges[asset.value.chainId]) {
      if (!showMainnetBadge && asset.value.chainId === ChainId.mainnet) {
        return base;
      }

      base.source = networkBadges[asset.value.chainId];
      return base;
    }

    const url = getCustomChainIconUrlWorklet(asset.value.chainId, asset.value.address);
    if (url) {
      // @ts-ignore
      base.source = { url };
      return base;
    }
    return base;
  });

  return (
    <View style={[sx.badge, { borderRadius: size / 2, height: size, width: size }]}>
      {/* ⚠️ TODO: This works but we should figure out how to type this correctly to avoid this error */}
      {/* @ts-expect-error: Doesn't pick up that it's getting a source prop via animatedProps */}
      <Animated.Image style={{ width: size, height: size, borderRadius: (size / 2) * PIXEL_RATIO }} animatedProps={animatedIconSource} />
    </View>
  );
}

const sx = StyleSheet.create({
  badge: {
    bottom: 0,
    left: -8,
    position: 'absolute',
    shadowColor: globalColors.grey100,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
