import React from 'react';
import { Image, ImageSourcePropType, View, ViewStyle } from 'react-native';
import ArbitrumBadge from '@/assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '@/assets/badges/arbitrumBadgeDark.png';
import OptimismBadge from '@/assets/badges/optimismBadge.png';
import OptimismBadgeDark from '@/assets/badges/optimismBadgeDark.png';
import PolygonBadge from '@/assets/badges/polygonBadge.png';
import PolygonBadgeDark from '@/assets/badges/polygonBadgeDark.png';
import BscBadge from '@/assets/badges/bscBadge.png';
import BscBadgeDark from '@/assets/badges/bscBadgeDark.png';
import ZoraBadge from '@/assets/badges/zoraBadge.png';
import ZoraBadgeDark from '@/assets/badges/zoraBadgeDark.png';
import BaseBadge from '@/assets/badges/baseBadge.png';
import BaseBadgeDark from '@/assets/badges/baseBadgeDark.png';
import AvalancheBadge from '@/assets/badges/avalancheBadge.png';
import AvalancheBadgeDark from '@/assets/badges/avalancheBadgeDark.png';
import BlastBadge from '@/assets/badges/blastBadge.png';
import BlastBadgeDark from '@/assets/badges/blastBadgeDark.png';
import DegenBadge from '@/assets/badges/degenBadge.png';
import DegenBadgeDark from '@/assets/badges/degenBadgeDark.png';
import { Network } from '@/networks/types';

interface FastChainBadgeProps {
  network: Network;
  theme: any;
}

const AssetIconsByTheme: {
  [key in Network]?: {
    dark: ImageSourcePropType;
    light: ImageSourcePropType;
  };
} = {
  [Network.arbitrum]: {
    dark: ArbitrumBadgeDark,
    light: ArbitrumBadge,
  },
  [Network.optimism]: {
    dark: OptimismBadgeDark,
    light: OptimismBadge,
  },
  [Network.polygon]: {
    dark: PolygonBadgeDark,
    light: PolygonBadge,
  },
  [Network.bsc]: {
    dark: BscBadgeDark,
    light: BscBadge,
  },
  [Network.zora]: {
    dark: ZoraBadgeDark,
    light: ZoraBadge,
  },
  [Network.base]: {
    dark: BaseBadgeDark,
    light: BaseBadge,
  },
  [Network.avalanche]: {
    dark: AvalancheBadgeDark,
    light: AvalancheBadge,
  },
  [Network.blast]: {
    dark: BlastBadgeDark,
    light: BlastBadge,
  },
  [Network.degen]: {
    dark: DegenBadgeDark,
    light: DegenBadge,
  },
};

export const FastChainBadge = React.memo(function FastChainBadge({ network, theme }: FastChainBadgeProps) {
  const { isDarkMode } = theme;

  const source = AssetIconsByTheme[network]?.[isDarkMode ? 'dark' : 'light'];

  if (!source) return null;

  const imageStyles = {
    height: 44,
    top: 4,
    width: 44,
  };

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    bottom: 5.5,
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
