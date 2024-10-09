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
const ApechainBadge = require('@/assets/badges/apechain.png');

import { ChainId } from '@/chains/types';
import { globalColors } from '@/design-system';
import { PIXEL_RATIO } from '@/utils/deviceUtils';
import { useSwapsStore } from '@/state/swaps/swapsStore';

const networkBadges = {
  [ChainId.apechain]: ApechainBadge,
  [ChainId.arbitrum]: ArbitrumBadge,
  [ChainId.arbitrumSepolia]: ArbitrumBadge,
  [ChainId.avalanche]: AvalancheBadge,
  [ChainId.avalancheFuji]: AvalancheBadge,
  [ChainId.base]: BaseBadge,
  [ChainId.baseSepolia]: BaseBadge,
  [ChainId.blast]: BlastBadge,
  [ChainId.blastSepolia]: BlastBadge,
  [ChainId.bsc]: BscBadge,
  [ChainId.bscTestnet]: BscBadge,
  [ChainId.degen]: DegenBadge,
  [ChainId.holesky]: EthereumBadge,
  [ChainId.mainnet]: EthereumBadge,
  [ChainId.optimism]: OptimismBadge,
  [ChainId.optimismSepolia]: OptimismBadge,
  [ChainId.polygon]: PolygonBadge,
  [ChainId.polygonAmoy]: PolygonBadge,
  [ChainId.sepolia]: EthereumBadge,
  [ChainId.zora]: ZoraBadge,
  [ChainId.zoraSepolia]: ZoraBadge,
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
