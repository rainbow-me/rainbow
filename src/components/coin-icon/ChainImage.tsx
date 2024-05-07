import React, { useMemo } from 'react';
import { Image, ImageSourcePropType } from 'react-native';

import { IS_IOS } from '@/env';
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

export function ChainImage({ chain, size = 20 }: { chain: Network | null | undefined; size?: number }) {
  const source = useMemo(() => {
    let val: ImageSourcePropType = { uri: '' };
    if (chain === Network.arbitrum) {
      val = IS_IOS ? { uri: 'arbitrum' } : ArbitrumBadge;
    } else if (chain === Network.base) {
      val = IS_IOS ? { uri: 'base' } : BaseBadge;
    } else if (chain === Network.bsc) {
      val = IS_IOS ? { uri: 'bsc' } : BscBadge;
    } else if (chain === Network.mainnet) {
      val = IS_IOS ? { uri: 'ethereum' } : EthereumBadge;
    } else if (chain === Network.optimism) {
      val = IS_IOS ? { uri: 'optimism' } : OptimismBadge;
    } else if (chain === Network.polygon) {
      val = IS_IOS ? { uri: 'polygon' } : PolygonBadge;
    } else if (chain === Network.zora) {
      val = IS_IOS ? { uri: 'zora' } : ZoraBadge;
    } else if (chain === Network.avalanche) {
      val = IS_IOS ? { uri: 'avalanche' } : AvalancheBadge;
    } else if (chain === Network.blast) {
      val = IS_IOS ? { uri: 'blast' } : BlastBadge;
    } else if (chain === Network.degen) {
      val = IS_IOS ? { uri: 'degen' } : DegenBadge;
    }
    return val;
  }, [chain]);

  if (!chain) return null;

  return <Image source={source} style={{ borderRadius: size / 2, height: size, width: size }} />;
}
