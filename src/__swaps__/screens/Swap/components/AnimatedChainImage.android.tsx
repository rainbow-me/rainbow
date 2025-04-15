/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import { useChainBadges } from '@/components/coin-icon/ChainBadgeContext';
import { getChainBadgeStyles } from '@/components/coin-icon/ChainImage';
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
  const chainBadges = useChainBadges();
  const chainIdState = useSwapsStore(state => state[assetType === 'input' ? 'inputAsset' : 'outputAsset']?.chainId);

  const iconSource = useMemo(() => {
    let source = { uri: '' };
    if (chainIdState !== undefined && !(!showMainnetBadge && chainIdState === ChainId.mainnet)) {
      source = {
        uri: size > 20 ? chainBadges[chainIdState]?.uncropped?.largeURL ?? '' : chainBadges[chainIdState]?.uncropped?.smallURL ?? '',
      };
    } else {
      source = { uri: '' };
    }
    return source;
  }, [chainBadges, chainIdState, showMainnetBadge, size]);

  const { containerStyle, iconStyle } = useMemo(
    () => getChainBadgeStyles({ badgeXPosition: -size / 2, badgeYPosition: 0, position: 'absolute', shadow: false, size }),
    [size]
  );

  return (
    <View style={containerStyle}>
      <Image resizeMode="cover" source={iconSource} style={iconStyle} />
    </View>
  );
}
