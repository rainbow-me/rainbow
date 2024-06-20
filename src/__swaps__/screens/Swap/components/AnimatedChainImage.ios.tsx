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
import { useAnimatedProps } from 'react-native-reanimated';
import { AddressOrEth } from '@/__swaps__/types/assets';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { globalColors } from '@/design-system';
import { customChainIdsToAssetNames } from '@/__swaps__/utils/chains';
import { AddressZero } from '@ethersproject/constants';
import { ETH_ADDRESS } from '@/references';
import { IS_ANDROID } from '@/env';
import { PIXEL_RATIO } from '@/utils/deviceUtils';
import { useSwapContext } from '../providers/swap-provider';

const networkBadges = {
  [ChainId.mainnet]: Image.resolveAssetSource(EthereumBadge).uri,
  [ChainId.polygon]: Image.resolveAssetSource(PolygonBadge).uri,
  [ChainId.optimism]: Image.resolveAssetSource(OptimismBadge).uri,
  [ChainId.arbitrum]: Image.resolveAssetSource(ArbitrumBadge).uri,
  [ChainId.base]: Image.resolveAssetSource(BaseBadge).uri,
  [ChainId.zora]: Image.resolveAssetSource(ZoraBadge).uri,
  [ChainId.bsc]: Image.resolveAssetSource(BscBadge).uri,
  [ChainId.avalanche]: Image.resolveAssetSource(AvalancheBadge).uri,
  [ChainId.sepolia]: Image.resolveAssetSource(EthereumBadge).uri,
  [ChainId.holesky]: Image.resolveAssetSource(EthereumBadge).uri,
  [ChainId.optimismSepolia]: Image.resolveAssetSource(OptimismBadge).uri,
  [ChainId.bscTestnet]: Image.resolveAssetSource(BscBadge).uri,
  [ChainId.polygonAmoy]: Image.resolveAssetSource(PolygonBadge).uri,
  [ChainId.arbitrumSepolia]: Image.resolveAssetSource(ArbitrumBadge).uri,
  [ChainId.baseSepolia]: Image.resolveAssetSource(BaseBadge).uri,
  [ChainId.zoraSepolia]: Image.resolveAssetSource(ZoraBadge).uri,
  [ChainId.avalancheFuji]: Image.resolveAssetSource(AvalancheBadge).uri,
  [ChainId.blast]: Image.resolveAssetSource(BlastBadge).uri,
  [ChainId.blastSepolia]: Image.resolveAssetSource(BlastBadge).uri,
  [ChainId.degen]: Image.resolveAssetSource(DegenBadge).uri,
};

const getCustomChainIconUrlWorklet = (chainId: ChainId, address: AddressOrEth) => {
  'worklet';

  if (!chainId || !customChainIdsToAssetNames[chainId]) return '';
  const baseUrl = 'https://raw.githubusercontent.com/rainbow-me/assets/master/blockchains/';

  if (address === AddressZero || address === ETH_ADDRESS) {
    return `${baseUrl}${customChainIdsToAssetNames[chainId]}/info/logo.png`;
  } else {
    return `${baseUrl}${customChainIdsToAssetNames[chainId]}/assets/${address}/logo.png`;
  }
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
  const asset = assetType === 'input' ? internalSelectedInputAsset : internalSelectedOutputAsset;

  const animatedIconSource = useAnimatedProps(() => {
    const base = {
      source: {
        ...DEFAULT_FASTER_IMAGE_CONFIG,
        borderRadius: IS_ANDROID ? (size / 2) * PIXEL_RATIO : size / 2,
        url: '',
      },
    };
    if (!asset?.value) {
      if (!showMainnetBadge) {
        return base;
      }

      base.source.url = networkBadges[ChainId.mainnet];
      return base;
    }

    if (networkBadges[asset.value.chainId]) {
      if (!showMainnetBadge && asset.value.chainId === ChainId.mainnet) {
        return base;
      }
      base.source.url = networkBadges[asset.value.chainId];
      return base;
    }

    const url = getCustomChainIconUrlWorklet(asset.value.chainId, asset.value.address);
    if (url) {
      base.source.url = url;
      return base;
    }

    return base;
  });

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
