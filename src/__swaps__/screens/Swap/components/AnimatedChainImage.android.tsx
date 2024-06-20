/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

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
import { useSwapsStore } from '@/state/swaps/swapsStore';

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

export function AnimatedChainImage({
  assetType,
  showMainnetBadge = false,
  size = 20,
}: {
  assetType: 'input' | 'output';
  showMainnetBadge?: boolean;
  size?: number;
}) {
  const chainIdState = useSwapsStore(state => state[assetType === 'input' ? 'inputAsset' : 'outputAsset']?.chainId);

  const iconSource = useMemo(() => {
    let source = { uri: '' };

    if (chainIdState !== undefined && !(!showMainnetBadge && chainIdState === ChainId.mainnet)) {
      source = networkBadges[chainIdState];
    } else {
      source = { uri: '' };
    }

    return source;
  }, [chainIdState, showMainnetBadge]);

  return (
    <View style={[sx.badge, { borderRadius: size / 2, height: size, width: size }]}>
      <Image resizeMode="cover" source={iconSource} style={{ width: size, height: size, borderRadius: (size / 2) * PIXEL_RATIO }} />
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
