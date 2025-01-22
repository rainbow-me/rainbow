import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedProps, useDerivedValue } from 'react-native-reanimated';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { BLANK_BASE64_PIXEL } from '@/components/DappBrowser/constants';
import { getChainBadgeStyles } from '@/components/coin-icon/ChainImage';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { globalColors, useColorMode } from '@/design-system';
import { getChainsBadgeWorklet, useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { useSwapContext } from '../providers/swap-provider';

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
  const backendNetworks = useBackendNetworksStore(state => state.backendNetworksSharedValue);

  const url = useDerivedValue(() => {
    const asset = assetType === 'input' ? internalSelectedInputAsset : internalSelectedOutputAsset;
    const chainId = asset?.value?.chainId;

    let url = 'eth';
    if (chainId !== undefined && !(!showMainnetBadge && chainId === ChainId.mainnet)) {
      url = getChainsBadgeWorklet(backendNetworks)[chainId];
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
