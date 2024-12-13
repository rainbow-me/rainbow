/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { ChainId } from '@/state/backendNetworks/types';
import { globalColors } from '@/design-system';
import { PIXEL_RATIO } from '@/utils/deviceUtils';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export function AnimatedChainImage({
  assetType,
  showMainnetBadge = false,
  size = 20,
}: {
  assetType: 'input' | 'output';
  showMainnetBadge?: boolean;
  size?: number;
}) {
  const chainIdState = useSwapsStore(state => state[assetType === 'input' ? 'inputAsset' : 'outputAsset']?.chainId);

  const iconSource = useMemo(() => {
    let source = { uri: '' };

    if (chainIdState !== undefined && !(!showMainnetBadge && chainIdState === ChainId.mainnet)) {
      source = { uri: useBackendNetworksStore.getState().getChainsBadge()[chainIdState] };
    } else {
      source = { uri: '' };
    }

    return source;
  }, [chainIdState, showMainnetBadge]);

  return (
    <View style={[sx.badge, { borderRadius: size / 2, height: size, width: size }]}>
      <Image resizeMode="cover" source={iconSource} style={{ width: size, height: size, borderRadius: (size / 2) * PIXEL_RATIO }} />
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
