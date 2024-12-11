import React, { useMemo, forwardRef } from 'react';
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
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';
import Animated from 'react-native-reanimated';

export const ChainImage = forwardRef(function ChainImage(
  {
    chainId,
    size = 20,
    style,
  }: {
    chainId: ChainId | null | undefined;
    size?: number;
    style?: FastImageProps['style'];
  },
  ref
) {
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
    <FastImage
      // @ts-expect-error couldn't figure out how to type this ref to make ts happy
      ref={ref}
      key={`${chainId}-badge-${size}`}
      source={source as Source}
      style={[{ borderRadius: size / 2, height: size, width: size }, style]}
    />
  );
});

export const AnimatedChainImage = Animated.createAnimatedComponent(ChainImage);
