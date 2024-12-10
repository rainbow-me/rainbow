import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { ChainId } from '@/chains/types';
import { globalColors } from '@/design-system';
import { PIXEL_RATIO } from '@/utils/deviceUtils';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { getCustomChainIconUrl, type AnimatedChainImageProps } from './AnimatedChainImage';

export function AnimatedChainImage({
  assetType,
  showMainnetBadge = false,
  shadowConfig = sx.shadow,
  size = 20,
  style = sx.badge,
}: AnimatedChainImageProps) {
  const chainIdState = useSwapsStore(state => state[assetType === 'input' ? 'inputAsset' : 'outputAsset']?.chainId);
  const address = useSwapsStore(state => state[assetType === 'input' ? 'inputAsset' : 'outputAsset']?.address);

  const iconSource = useMemo(() => {
    let source = { uri: '' };

    if (chainIdState !== undefined && !(!showMainnetBadge && chainIdState === ChainId.mainnet)) {
      source = { uri: getCustomChainIconUrl(chainIdState, address) };
    } else {
      source = { uri: '' };
    }

    return source;
  }, [chainIdState, showMainnetBadge, address]);

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
