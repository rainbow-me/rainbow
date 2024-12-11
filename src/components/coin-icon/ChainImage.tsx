import React, { useMemo } from 'react';
import { ChainId } from '@/state/backendNetworks/types';

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
import ApechainBadge from '@/assets/badges/apechain.png';
import FastImage, { Source } from 'react-native-fast-image';

export function ChainImage({ chainId, size = 20 }: { chainId: ChainId | null | undefined; size?: number }) {
  const source = useMemo(() => {
    switch (chainId) {
      case ChainId.apechain:
        return ApechainBadge;
      case ChainId.arbitrum:
        return ArbitrumBadge;
      case ChainId.base:
        return BaseBadge;
      case ChainId.bsc:
        return BscBadge;
      case ChainId.mainnet:
        return EthereumBadge;
      case ChainId.optimism:
        return OptimismBadge;
      case ChainId.polygon:
        return PolygonBadge;
      case ChainId.zora:
        return ZoraBadge;
      case ChainId.avalanche:
        return AvalancheBadge;
      case ChainId.blast:
        return BlastBadge;
      case ChainId.degen:
        return DegenBadge;
      default:
        return { uri: '' };
    }
  }, [chainId]);

  if (!chainId) return null;

  return (
    <FastImage key={`${chainId}-badge-${size}`} source={source as Source} style={{ borderRadius: size / 2, height: size, width: size }} />
  );
}
