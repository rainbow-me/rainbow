/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { ChainId } from '@/state/backendNetworks/types';
import { globalColors } from '@/design-system';
import { PIXEL_RATIO } from '@/utils/deviceUtils';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { DerivedValue } from 'react-native-reanimated';

export function AnimatedChainImage({
  chainId,
  showMainnetBadge = false,
  size = 20,
}: {
  chainId: DerivedValue<ChainId | undefined>;
  showMainnetBadge?: boolean;
  size?: number;
}) {
  const iconSource = useMemo(() => {
    let source = { uri: '' };
    const value = typeof chainId === 'number' ? chainId : chainId?.value;
    if (value !== undefined && !(!showMainnetBadge && value === ChainId.mainnet)) {
      source = { uri: useBackendNetworksStore.getState().getChainsBadge()[value] };
    } else {
      source = { uri: '' };
    }

    return source;
  }, [chainId, showMainnetBadge]);

  return (
    <View style={[sx.badge, { borderRadius: size / 2, height: size, width: size, bottom: -size / 2 + 2, left: -size / 2 + 2 }]}>
      <Image resizeMode="cover" source={iconSource} style={{ width: size, height: size, borderRadius: (size / 2) * PIXEL_RATIO }} />
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
