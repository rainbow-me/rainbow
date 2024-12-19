import React, { useMemo } from 'react';
import { ChainId } from '@/state/backendNetworks/types';

import ApechainBadge from '@/assets/badges/apechain.png';
import ArbitrumBadge from '@/assets/badges/arbitrum.png';
import AvalancheBadge from '@/assets/badges/avalanche.png';
import BaseBadge from '@/assets/badges/base.png';
import BlastBadge from '@/assets/badges/blast.png';
import BscBadge from '@/assets/badges/bsc.png';
import DegenBadge from '@/assets/badges/degen.png';
import EthereumBadge from '@/assets/badges/ethereum.png';
import GnosisBadge from '@/assets/badges/gnosis.png';
import GravityBadge from '@/assets/badges/gravity.png';
import InkBadge from '@/assets/badges/ink.png';
import LineaBadge from '@/assets/badges/linea.png';
import OptimismBadge from '@/assets/badges/optimism.png';
import PolygonBadge from '@/assets/badges/polygon.png';
import SankoBadge from '@/assets/badges/sanko.png';
import ScrollBadge from '@/assets/badges/scroll.png';
import ZksyncBadge from '@/assets/badges/zksync.png';
import ZoraBadge from '@/assets/badges/zora.png';

import FastImage, { Source } from 'react-native-fast-image';

export function ChainImage({ chainId, size = 20 }: { chainId: ChainId | null | undefined; size?: number }) {
  const source = useMemo(() => {
    switch (chainId) {
      case ChainId.apechain:
        return ApechainBadge;
      case ChainId.arbitrum:
        return ArbitrumBadge;
      case ChainId.avalanche:
        return AvalancheBadge;
      case ChainId.base:
        return BaseBadge;
      case ChainId.blast:
        return BlastBadge;
      case ChainId.bsc:
        return BscBadge;
      case ChainId.degen:
        return DegenBadge;
      case ChainId.gnosis:
        return GnosisBadge;
      case ChainId.gravity:
        return GravityBadge;
      case ChainId.ink:
        return InkBadge;
      case ChainId.linea:
        return LineaBadge;
      case ChainId.mainnet:
        return EthereumBadge;
      case ChainId.optimism:
        return OptimismBadge;
      case ChainId.polygon:
        return PolygonBadge;
      case ChainId.sanko:
        return SankoBadge;
      case ChainId.scroll:
        return ScrollBadge;
      case ChainId.zksync:
        return ZksyncBadge;
      case ChainId.zora:
        return ZoraBadge;
      default:
        return { uri: '' };
    }
  }, [chainId]);

  if (!chainId) return null;

  return (
    <FastImage key={`${chainId}-badge-${size}`} source={source as Source} style={{ borderRadius: size / 2, height: size, width: size }} />
  );
}
