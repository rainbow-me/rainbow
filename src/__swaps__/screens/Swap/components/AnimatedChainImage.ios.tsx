import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DerivedValue, useAnimatedProps, useDerivedValue } from 'react-native-reanimated';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { BLANK_BASE64_PIXEL } from '@/components/DappBrowser/constants';
import { getChainBadgeStyles } from '@/components/coin-icon/ChainImage';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { globalColors, useColorMode } from '@/design-system';
import { getChainsBadgeWorklet, useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';

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
