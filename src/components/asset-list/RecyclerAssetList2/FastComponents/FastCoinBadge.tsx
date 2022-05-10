import React from 'react';
import { View, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import ArbitrumBadge from '../../../../assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '../../../../assets/badges/arbitrumBadgeDark.png';
import OptimismBadge from '../../../../assets/badges/optimismBadge.png';
import OptimismBadgeDark from '../../../../assets/badges/optimismBadgeDark.png';
import PolygonBadge from '../../../../assets/badges/polygonBadge.png';
import PolygonBadgeDark from '../../../../assets/badges/polygonBadgeDark.png';
import { AssetType } from '@rainbow-me/entities';

interface FastChainBadgeProps {
  assetType: keyof typeof AssetType;
  theme: any;
}

export const FastChainBadge = React.memo(function FastChainBadge({
  assetType,
  theme,
}: FastChainBadgeProps) {
  const { isDarkMode } = theme;

  let source = null;

  if (assetType === AssetType.arbitrum) {
    source = isDarkMode ? ArbitrumBadgeDark : ArbitrumBadge;
  } else if (assetType === AssetType.optimism) {
    source = isDarkMode ? OptimismBadgeDark : OptimismBadge;
  } else if (assetType === AssetType.polygon) {
    source = isDarkMode ? PolygonBadgeDark : PolygonBadge;
  }

  if (!source) return null;

  const imageStyles = {
    height: 44,
    top: 20 / 5,
    width: 44,
  };

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    bottom: 0,
    elevation: 10,
    height: 20,
    left: -7,
    position: 'absolute',
    width: 20,
    zIndex: 10,
  };

  return (
    <View style={containerStyle}>
      <FastImage
        // @ts-expect-error
        source={source}
        style={imageStyles}
      />
    </View>
  );
});
