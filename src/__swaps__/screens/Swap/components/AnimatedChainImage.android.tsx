import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import { getChainBadgeStyles } from '@/components/coin-icon/ChainImage';
import { useColorMode } from '@/design-system';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { useSwapsStore } from '@/state/swaps/swapsStore';

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

  const { isDarkMode } = useColorMode();
  const { containerStyle, iconStyle } = useMemo(
    () => getChainBadgeStyles({ badgeXPosition: -size / 2, badgeYPosition: 0, isDarkMode, position: 'absolute', size }),
    [isDarkMode, size]
  );

  return (
    <View style={containerStyle}>
      <Image resizeMode="cover" source={iconSource} style={iconStyle} />
    </View>
  );
}
