import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { ChainId } from '@/state/backendNetworks/types';
import { useAnimatedProps, useDerivedValue } from 'react-native-reanimated';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { globalColors } from '@/design-system';
import { useSwapContext } from '../providers/swap-provider';
import { BLANK_BASE64_PIXEL } from '@/components/DappBrowser/constants';

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

const networkBadges = {
  [ChainId.apechain]: Image.resolveAssetSource(ApechainBadge).uri,
  [ChainId.arbitrum]: Image.resolveAssetSource(ArbitrumBadge).uri,
  [ChainId.arbitrumSepolia]: Image.resolveAssetSource(ArbitrumBadge).uri,
  [ChainId.avalanche]: Image.resolveAssetSource(AvalancheBadge).uri,
  [ChainId.avalancheFuji]: Image.resolveAssetSource(AvalancheBadge).uri,
  [ChainId.base]: Image.resolveAssetSource(BaseBadge).uri,
  [ChainId.baseSepolia]: Image.resolveAssetSource(BaseBadge).uri,
  [ChainId.blast]: Image.resolveAssetSource(BlastBadge).uri,
  [ChainId.blastSepolia]: Image.resolveAssetSource(BlastBadge).uri,
  [ChainId.bsc]: Image.resolveAssetSource(BscBadge).uri,
  [ChainId.bscTestnet]: Image.resolveAssetSource(BscBadge).uri,
  [ChainId.degen]: Image.resolveAssetSource(DegenBadge).uri,
  [ChainId.gnosis]: Image.resolveAssetSource(GnosisBadge).uri,
  [ChainId.gravity]: Image.resolveAssetSource(GravityBadge).uri,
  [ChainId.holesky]: Image.resolveAssetSource(EthereumBadge).uri,
  [ChainId.ink]: Image.resolveAssetSource(InkBadge).uri,
  [ChainId.linea]: Image.resolveAssetSource(LineaBadge).uri,
  [ChainId.mainnet]: Image.resolveAssetSource(EthereumBadge).uri,
  [ChainId.optimism]: Image.resolveAssetSource(OptimismBadge).uri,
  [ChainId.optimismSepolia]: Image.resolveAssetSource(OptimismBadge).uri,
  [ChainId.polygon]: Image.resolveAssetSource(PolygonBadge).uri,
  [ChainId.polygonAmoy]: Image.resolveAssetSource(PolygonBadge).uri,
  [ChainId.sanko]: Image.resolveAssetSource(SankoBadge).uri,
  [ChainId.scroll]: Image.resolveAssetSource(ScrollBadge).uri,
  [ChainId.sepolia]: Image.resolveAssetSource(EthereumBadge).uri,
  [ChainId.zksync]: Image.resolveAssetSource(ZksyncBadge).uri,
  [ChainId.zora]: Image.resolveAssetSource(ZoraBadge).uri,
  [ChainId.zoraSepolia]: Image.resolveAssetSource(ZoraBadge).uri,
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
  const { internalSelectedInputAsset, internalSelectedOutputAsset } = useSwapContext();

  const url = useDerivedValue(() => {
    const asset = assetType === 'input' ? internalSelectedInputAsset : internalSelectedOutputAsset;
    const chainId = asset?.value?.chainId;

    let url = 'eth';

    if (chainId !== undefined && !(!showMainnetBadge && chainId === ChainId.mainnet)) {
      url = networkBadges[chainId];
    }
    return url;
  });

  const animatedIconSource = useAnimatedProps(() => ({
    source: {
      ...DEFAULT_FASTER_IMAGE_CONFIG,
      base64Placeholder: BLANK_BASE64_PIXEL,
      borderRadius: size / 2,
      url: url.value,
    },
  }));

  return (
    <View style={[sx.badge, { borderRadius: size / 2, height: size, width: size }]}>
      {/* ⚠️ TODO: This works but we should figure out how to type this correctly to avoid this error */}
      {/* @ts-expect-error: Doesn't pick up that it's getting a source prop via animatedProps */}
      <AnimatedFasterImage style={{ height: size, width: size }} animatedProps={animatedIconSource} />
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
