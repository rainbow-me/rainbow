import React, { useMemo } from 'react';
import Animated, { useAnimatedProps, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { BLANK_BASE64_PIXEL } from '@/components/DappBrowser/constants';
import { useChainBadges } from '@/components/coin-icon/ChainBadgeContext';
import { getChainBadgeStyles } from '@/components/coin-icon/ChainImage';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
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
  const chainBadges = useChainBadges();

  const url = useDerivedValue(() => {
    const asset = assetType === 'input' ? internalSelectedInputAsset : internalSelectedOutputAsset;
    const chainId = asset?.value?.chainId;

    let url = '';
    if (chainId !== undefined && !(!showMainnetBadge && chainId === ChainId.mainnet)) {
      url = size > 20 ? chainBadges[chainId]?.uncropped?.largeURL ?? '' : chainBadges[chainId]?.uncropped?.smallURL ?? '';
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

  const { containerStyle, iconStyle } = useMemo(
    () => getChainBadgeStyles({ badgeXPosition: -size / 2, badgeYPosition: 0, position: 'absolute', shadow: false, size }),
    [size]
  );

  const opacityStyle = useAnimatedStyle(() => ({ opacity: url.value ? 1 : 0 }));

  return (
    <Animated.View style={[containerStyle, opacityStyle]}>
      {/* ⚠️ TODO: This works but we should figure out how to type this correctly to avoid this error */}
      {/* @ts-expect-error: Doesn't pick up that it's getting a source prop via animatedProps */}
      <AnimatedFasterImage style={iconStyle} animatedProps={animatedIconSource} />
    </Animated.View>
  );
}
