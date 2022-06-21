import React from 'react';
import { Image, View, ViewStyle } from 'react-native';
import ArbitrumBadge from '@rainbow-me/assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '@rainbow-me/assets/badges/arbitrumBadgeDark.png';
import OptimismBadge from '@rainbow-me/assets/badges/optimismBadge.png';
import OptimismBadgeDark from '@rainbow-me/assets/badges/optimismBadgeDark.png';
import PolygonBadge from '@rainbow-me/assets/badges/polygonBadge.png';
import PolygonBadgeDark from '@rainbow-me/assets/badges/polygonBadgeDark.png';
import { AssetType } from '@rainbow-me/entities';

interface FastChainBadgeProps {
  assetType: AssetType;
  theme: any;
}

const AssetIconsByTheme: {
  [key in AssetType]?: {
    dark: StaticImageData;
    light: StaticImageData;
  };
} = {
  [AssetType.arbitrum]: {
    dark: ArbitrumBadgeDark,
    light: ArbitrumBadge,
  },
  [AssetType.optimism]: {
    dark: OptimismBadgeDark,
    light: OptimismBadge,
  },
  [AssetType.polygon]: {
    dark: PolygonBadgeDark,
    light: PolygonBadge,
  },
};

export const FastChainBadge = React.memo(function FastChainBadge({
  assetType,
  theme,
}: FastChainBadgeProps) {
  const { isDarkMode } = theme;

  const source = AssetIconsByTheme[assetType]?.[isDarkMode ? 'dark' : 'light'];

  if (!source) return null;

  const imageStyles = {
    height: 44,
    top: 4,
    width: 44,
  };

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    bottom: 14.5,
    elevation: 10,
    height: 28,
    left: -11.5,
    position: 'absolute',
    width: 28,
    zIndex: 10,
  };

  return (
    <View style={containerStyle}>
      <Image source={source} style={imageStyles} />
    </View>
  );
});
