/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

const ApechainBadge = require('@/assets/badges/apechain.png');
const ArbitrumBadge = require('@/assets/badges/arbitrum.png');
const AvalancheBadge = require('@/assets/badges/avalanche.png');
const BaseBadge = require('@/assets/badges/base.png');
const BlastBadge = require('@/assets/badges/blast.png');
const BscBadge = require('@/assets/badges/bsc.png');
const DegenBadge = require('@/assets/badges/degen.png');
const EthereumBadge = require('@/assets/badges/ethereum.png');
// const GnosisBadge = require('@/assets/badges/gnosis.png');
// const GravityBadge = require('@/assets/badges/gravity.png');
const InkBadge = require('@/assets/badges/ink.png');
// const LineaBadge = require('@/assets/badges/linea.png');
const OptimismBadge = require('@/assets/badges/optimism.png');
const PolygonBadge = require('@/assets/badges/polygon.png');
// const SankoBadge = require('@/assets/badges/sanko.png');
// const ScrollBadge = require('@/assets/badges/scroll.png');
// const ZksyncBadge = require('@/assets/badges/zksync.png');
const ZoraBadge = require('@/assets/badges/zora.png');

import { ChainId } from '@/state/backendNetworks/types';
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
  // [ChainId.gnosis]: GnosisBadge,
  // [ChainId.gravity]: GravityBadge,
  [ChainId.holesky]: EthereumBadge,
  [ChainId.ink]: InkBadge,
  // [ChainId.linea]: LineaBadge,
  [ChainId.mainnet]: EthereumBadge,
  [ChainId.optimism]: OptimismBadge,
  [ChainId.optimismSepolia]: OptimismBadge,
  [ChainId.polygon]: PolygonBadge,
  [ChainId.polygonAmoy]: PolygonBadge,
  // [ChainId.sanko]: SankoBadge,
  // [ChainId.scroll]: ScrollBadge,
  [ChainId.sepolia]: EthereumBadge,
  // [ChainId.zksync]: ZksyncBadge,
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
