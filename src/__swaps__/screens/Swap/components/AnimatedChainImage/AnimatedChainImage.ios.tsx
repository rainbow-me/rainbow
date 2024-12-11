import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ChainId } from '@/chains/types';
import { useAnimatedProps, useDerivedValue } from 'react-native-reanimated';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { globalColors } from '@/design-system';
import { BLANK_BASE64_PIXEL } from '@/components/DappBrowser/constants';
import { type AnimatedChainImageProps } from './types';
import { chainsBadges } from '@/chains';

export function AnimatedChainImage({
  asset,
  showMainnetBadge = false,
  shadowConfig = sx.shadow,
  size = 20,
  style = sx.badge,
}: AnimatedChainImageProps) {
  const url = useDerivedValue(() => {
    const chainId = asset?.value?.chainId;

    let url = 'eth';
    if (chainId !== undefined && !(!showMainnetBadge && chainId === ChainId.mainnet)) {
      url = chainsBadges[chainId];
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
