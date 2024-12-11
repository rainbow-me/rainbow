import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { ChainId } from '@/chains/types';
import { globalColors } from '@/design-system';
import { PIXEL_RATIO } from '@/utils/deviceUtils';
import { type AnimatedChainImageProps } from './types';
import { chainsBadges } from '@/chains';

export function AnimatedChainImage({
  asset,
  showMainnetBadge = false,
  shadowConfig = sx.shadow,
  size = 20,
  style = sx.badge,
}: AnimatedChainImageProps) {
  const iconSource = useMemo(() => {
    let source = { uri: '' };
    const chainId = asset?.value?.chainId;

    if (chainId !== undefined && !(!showMainnetBadge && chainId === ChainId.mainnet)) {
      source = { uri: chainsBadges[chainId] };
    } else {
      source = { uri: '' };
    }

    return source;
  }, [asset.value?.chainId, showMainnetBadge]);

  return (
    <View style={[style, shadowConfig, { borderRadius: size / 2, height: size, width: size }]}>
      <Image resizeMode="cover" source={iconSource} style={{ width: size, height: size, borderRadius: (size / 2) * PIXEL_RATIO }} />
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
