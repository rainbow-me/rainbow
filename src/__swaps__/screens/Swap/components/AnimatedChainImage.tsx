import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import ArbitrumBadge from '@/assets/badges/arbitrum.png';
import BaseBadge from '@/assets/badges/base.png';
import BscBadge from '@/assets/badges/bsc.png';
import EthereumBadge from '@/assets/badges/ethereum.png';
import OptimismBadge from '@/assets/badges/optimism.png';
import PolygonBadge from '@/assets/badges/polygon.png';
import ZoraBadge from '@/assets/badges/zora.png';
import AvalancheBadge from '@/assets/badges/avalanche.png';
import BlastBadge from '@/assets/badges/blast.png';
import DegenBadge from '@/assets/badges/degen.png';
import { ChainId } from '@/__swaps__/types/chains';
import { SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { AddressOrEth, ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { globalColors } from '@/design-system';
import { customChainIdsToAssetNames } from '@/__swaps__/utils/chains';
import { AddressZero } from '@ethersproject/constants';
import { ETH_ADDRESS } from '@/references';

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

export function AnimatedChainImage({ asset, size = 20 }: { asset: SharedValue<ExtendedAnimatedAssetWithColors | null>; size?: number }) {
  const animatedIconSource = useAnimatedProps(() => {
    const base = {
      source: {
        ...DEFAULT_FASTER_IMAGE_CONFIG,
        url: '',
      },
    };
    if (!asset?.value) {
      return base;
    }

    const url = getCustomChainIconUrlWorklet(asset.value.chainId, asset.value.address);
    if (url) {
      base.source.url = url;
      return base;
    }

    // fallback to static network badge data
    // TODO: How can we reference local static pngs here?
    base.source.url = `file://${networkBadges[asset.value.chainId]}`;
    return base;
  });

  return (
    <View style={sx.badge}>
      {/* @ts-expect-error source prop is missing */}
      <AnimatedFasterImage style={{ width: size, height: size }} animatedProps={animatedIconSource} />
    </View>
  );
}

const sx = StyleSheet.create({
  badge: {
    bottom: -0,
    left: -8,
    position: 'absolute',
    shadowColor: globalColors.grey100,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowRadius: 6,
    shadowOpacity: 0.2,
  },
});
