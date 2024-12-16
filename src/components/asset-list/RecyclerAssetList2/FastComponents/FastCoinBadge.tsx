import React from 'react';
import { Image, ImageSourcePropType, View, ViewStyle } from 'react-native';
import { ChainId } from '@/state/backendNetworks/types';

import ApechainBadge from '@/assets/badges/apechainBadge.png';
import ApechainBadgeDark from '@/assets/badges/apechainBadgeDark.png';
import ArbitrumBadge from '@/assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '@/assets/badges/arbitrumBadgeDark.png';
import AvalancheBadge from '@/assets/badges/avalancheBadge.png';
import AvalancheBadgeDark from '@/assets/badges/avalancheBadgeDark.png';
import BaseBadge from '@/assets/badges/baseBadge.png';
import BaseBadgeDark from '@/assets/badges/baseBadgeDark.png';
import BlastBadge from '@/assets/badges/blastBadge.png';
import BlastBadgeDark from '@/assets/badges/blastBadgeDark.png';
import BscBadge from '@/assets/badges/bscBadge.png';
import BscBadgeDark from '@/assets/badges/bscBadgeDark.png';
import DegenBadge from '@/assets/badges/degenBadge.png';
import DegenBadgeDark from '@/assets/badges/degenBadgeDark.png';
// import GnosisBadge from '@/assets/badges/gnosisBadge.png';
// import GnosisBadgeDark from '@/assets/badges/gnosisBadgeDark.png';
// import GravityBadge from '@/assets/badges/gravityBadge.png';
// import GravityBadgeDark from '@/assets/badges/gravityBadgeDark.png';
import InkBadge from '@/assets/badges/inkBadge.png';
import InkBadgeDark from '@/assets/badges/inkBadgeDark.png';
// import LineaBadge from '@/assets/badges/lineaBadge.png';
// import LineaBadgeDark from '@/assets/badges/lineaBadgeDark.png';
import OptimismBadge from '@/assets/badges/optimismBadge.png';
import OptimismBadgeDark from '@/assets/badges/optimismBadgeDark.png';
import PolygonBadge from '@/assets/badges/polygonBadge.png';
import PolygonBadgeDark from '@/assets/badges/polygonBadgeDark.png';
// import SankoBadge from '@/assets/badges/sankoBadge.png';
// import SankoBadgeDark from '@/assets/badges/sankoBadgeDark.png';
// import ScrollBadge from '@/assets/badges/scrollBadge.png';
// import ScrollBadgeDark from '@/assets/badges/scrollBadgeDark.png';
// import ZksyncBadge from '@/assets/badges/zksyncBadge.png';
// import ZksyncBadgeDark from '@/assets/badges/zksyncBadgeDark.png';
import ZoraBadge from '@/assets/badges/zoraBadge.png';
import ZoraBadgeDark from '@/assets/badges/zoraBadgeDark.png';

interface FastChainBadgeProps {
  chainId: ChainId;
  theme: any;
}

const AssetIconsByTheme: {
  [key in ChainId]?: {
    dark: ImageSourcePropType;
    light: ImageSourcePropType;
  };
} = {
  [ChainId.apechain]: {
    dark: ApechainBadgeDark,
    light: ApechainBadge,
  },
  [ChainId.arbitrum]: {
    dark: ArbitrumBadgeDark,
    light: ArbitrumBadge,
  },
  [ChainId.avalanche]: {
    dark: AvalancheBadgeDark,
    light: AvalancheBadge,
  },
  [ChainId.base]: {
    dark: BaseBadgeDark,
    light: BaseBadge,
  },
  [ChainId.blast]: {
    dark: BlastBadgeDark,
    light: BlastBadge,
  },
  [ChainId.bsc]: {
    dark: BscBadgeDark,
    light: BscBadge,
  },
  [ChainId.degen]: {
    dark: DegenBadgeDark,
    light: DegenBadge,
  },
  // [ChainId.gnosis]: {
  //   dark: GnosisBadgeDark,
  //   light: GnosisBadge,
  // },
  // [ChainId.gravity]: {
  //   dark: GravityBadgeDark,
  //   light: GravityBadge,
  // },
  [ChainId.ink]: {
    dark: InkBadgeDark,
    light: InkBadge,
  },
  // [ChainId.linea]: {
  //   dark: LineaBadgeDark,
  //   light: LineaBadge,
  // },
  [ChainId.optimism]: {
    dark: OptimismBadgeDark,
    light: OptimismBadge,
  },
  [ChainId.polygon]: {
    dark: PolygonBadgeDark,
    light: PolygonBadge,
  },
  // [ChainId.sanko]: {
  //   dark: SankoBadgeDark,
  //   light: SankoBadge,
  // },
  // [ChainId.scroll]: {
  //   dark: ScrollBadgeDark,
  //   light: ScrollBadge,
  // },
  // [ChainId.zksync]: {
  //   dark: ZksyncBadgeDark,
  //   light: ZksyncBadge,
  // },
  [ChainId.zora]: {
    dark: ZoraBadgeDark,
    light: ZoraBadge,
  },
};

export const FastChainBadge = React.memo(function FastChainBadge({ chainId, theme }: FastChainBadgeProps) {
  const { isDarkMode } = theme;

  const source = AssetIconsByTheme[chainId]?.[isDarkMode ? 'dark' : 'light'];

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
