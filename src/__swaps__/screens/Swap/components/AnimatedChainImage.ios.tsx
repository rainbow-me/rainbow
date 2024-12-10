import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { ChainId } from '@/chains/types';
import { useAnimatedProps, useDerivedValue } from 'react-native-reanimated';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { globalColors } from '@/design-system';
import { useSwapContext } from '../providers/swap-provider';
import { BLANK_BASE64_PIXEL } from '@/components/DappBrowser/constants';
import { getCustomChainIconUrl, type AnimatedChainImageProps } from './AnimatedChainImage';

export function AnimatedChainImage({
  assetType,
  showMainnetBadge = false,
  shadowConfig = sx.shadow,
  size = 20,
  style = sx.badge,
}: AnimatedChainImageProps) {
  const { internalSelectedInputAsset, internalSelectedOutputAsset } = useSwapContext();

  const url = useDerivedValue(() => {
    const asset = assetType === 'input' ? internalSelectedInputAsset : internalSelectedOutputAsset;
    const chainId = asset?.value?.chainId;

    let url = 'eth';

    if (chainId !== undefined && !(!showMainnetBadge && chainId === ChainId.mainnet)) {
      url = getCustomChainIconUrl(chainId, asset?.value?.address);
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
    <View style={[style, shadowConfig, { borderRadius: size / 2, height: size, width: size }]}>
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
  },
  shadow: {
    shadowColor: globalColors.grey100,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
