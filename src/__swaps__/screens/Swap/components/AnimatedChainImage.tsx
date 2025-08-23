import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { BLANK_BASE64_PIXEL } from '@/components/DappBrowser/constants';
import { getChainBadgeStyles } from '@/components/coin-icon/ChainImage';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { useColorMode } from '@/design-system';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { SharedValue, useAnimatedProps, useDerivedValue } from 'react-native-reanimated';

export function AnimatedChainImage({
  asset,
  showMainnetBadge = false,
  size = 20,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  showMainnetBadge?: boolean;
  size?: number;
}) {
  const networkBadges = useBackendNetworksStore(state => state.getChainsBadge());

  const url = useDerivedValue(() => {
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
      url: url.value,
    },
  }));

  const { isDarkMode } = useColorMode();
  const { containerStyle, iconStyle } = useMemo(
    () => getChainBadgeStyles({ badgeXPosition: -size / 2, badgeYPosition: 0, isDarkMode, position: 'absolute', size }),
    [isDarkMode, size]
  );

  return (
    <View style={containerStyle}>
      {/* ⚠️ TODO: This works but we should figure out how to type this correctly to avoid this error */}
      {/* @ts-expect-error: Doesn't pick up that it's getting a source prop via animatedProps */}
      <AnimatedFasterImage style={iconStyle} animatedProps={animatedIconSource} />
    </View>
  );
}
