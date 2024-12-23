import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ChainId } from '@/state/backendNetworks/types';
import { DerivedValue, useAnimatedProps, useDerivedValue } from 'react-native-reanimated';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { globalColors } from '@/design-system';
import { BLANK_BASE64_PIXEL } from '@/components/DappBrowser/constants';
import { getChainsBadgeWorklet, useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export function AnimatedChainImage({
  chainId,
  showMainnetBadge = false,
  size = 20,
}: {
  chainId: DerivedValue<ChainId | undefined>;
  showMainnetBadge?: boolean;
  size?: number;
}) {
  const backendNetworks = useBackendNetworksStore(state => state.backendNetworksSharedValue);

  const url = useDerivedValue(() => {
    const value = typeof chainId === 'number' ? chainId : chainId?.value;

    let url = 'eth';
    if (value !== undefined && !(!showMainnetBadge && value === ChainId.mainnet)) {
      url = getChainsBadgeWorklet(backendNetworks)[value];
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
    <View style={[sx.badge, { borderRadius: size / 2, height: size, width: size, bottom: -size / 2 + 2, left: -size / 2 + 2 }]}>
      {/* ⚠️ TODO: This works but we should figure out how to type this correctly to avoid this error */}
      {/* @ts-expect-error: Doesn't pick up that it's getting a source prop via animatedProps */}
      <AnimatedFasterImage style={{ height: size, width: size }} animatedProps={animatedIconSource} />
    </View>
  );
}

const sx = StyleSheet.create({
  badge: {
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
