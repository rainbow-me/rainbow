import React, { useMemo } from 'react';
import { Network } from '@/helpers';

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
import FastImage, { Source } from 'react-native-fast-image';

export function ChainImage({ chain, size = 20 }: { chain: Network | null | undefined; size?: number }) {
  const source = useMemo(() => {
    switch (chain) {
      case Network.arbitrum:
        return ArbitrumBadge;
      case Network.base:
        return BaseBadge;
      case Network.bsc:
        return BscBadge;
      case Network.mainnet:
        return EthereumBadge;
      case Network.optimism:
        return OptimismBadge;
      case Network.polygon:
        return PolygonBadge;
      case Network.zora:
        return ZoraBadge;
      case Network.avalanche:
        return AvalancheBadge;
      case Network.blast:
        return BlastBadge;
      case Network.degen:
        return DegenBadge;
      default:
        return { uri: '' };
    }
  }, [chain]);

  if (!chain) return null;

  return (
    <FastImage key={`${chain}-badge-${size}`} source={source as Source} style={{ borderRadius: size / 2, height: size, width: size }} />
  );
}
