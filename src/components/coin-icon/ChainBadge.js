import React from 'react';
import FastImage from 'react-native-fast-image';

import ApechainBadge from '@/assets/badges/apechainBadge.png';
import ApechainBadgeDark from '@/assets/badges/apechainBadgeDark.png';
import ApechainBadgeLarge from '@/assets/badges/apechainBadgeLarge.png';
import ApechainBadgeLargeDark from '@/assets/badges/apechainBadgeLargeDark.png';
import ArbitrumBadge from '@/assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '@/assets/badges/arbitrumBadgeDark.png';
import ArbitrumBadgeLarge from '@/assets/badges/arbitrumBadgeLarge.png';
import ArbitrumBadgeLargeDark from '@/assets/badges/arbitrumBadgeLargeDark.png';
import AvalancheBadge from '@/assets/badges/avalancheBadge.png';
import AvalancheBadgeDark from '@/assets/badges/avalancheBadgeDark.png';
import AvalancheBadgeLarge from '@/assets/badges/avalancheBadgeLarge.png';
import AvalancheBadgeLargeDark from '@/assets/badges/avalancheBadgeLargeDark.png';
import BaseBadge from '@/assets/badges/baseBadge.png';
import BaseBadgeDark from '@/assets/badges/baseBadgeDark.png';
import BaseBadgeLarge from '@/assets/badges/baseBadgeLarge.png';
import BaseBadgeLargeDark from '@/assets/badges/baseBadgeLargeDark.png';
import BlastBadge from '@/assets/badges/blastBadge.png';
import BlastBadgeDark from '@/assets/badges/blastBadgeDark.png';
import BlastBadgeLarge from '@/assets/badges/blastBadgeLarge.png';
import BlastBadgeLargeDark from '@/assets/badges/blastBadgeLargeDark.png';
import BscBadge from '@/assets/badges/bscBadge.png';
import BscBadgeDark from '@/assets/badges/bscBadgeDark.png';
import BscBadgeLarge from '@/assets/badges/bscBadgeLarge.png';
import BscBadgeLargeDark from '@/assets/badges/bscBadgeLargeDark.png';
import DegenBadge from '@/assets/badges/degenBadge.png';
import DegenBadgeDark from '@/assets/badges/degenBadgeDark.png';
import DegenBadgeLarge from '@/assets/badges/degenBadgeLarge.png';
import DegenBadgeLargeDark from '@/assets/badges/degenBadgeLargeDark.png';
import GnosisBadge from '@/assets/badges/gnosisBadge.png';
import GnosisBadgeDark from '@/assets/badges/gnosisBadgeDark.png';
import GnosisBadgeLarge from '@/assets/badges/gnosisBadgeLarge.png';
import GnosisBadgeLargeDark from '@/assets/badges/gnosisBadgeLargeDark.png';
import GravityBadge from '@/assets/badges/gravityBadge.png';
import GravityBadgeDark from '@/assets/badges/gravityBadgeDark.png';
import GravityBadgeLarge from '@/assets/badges/gravityBadgeLarge.png';
import GravityBadgeLargeDark from '@/assets/badges/gravityBadgeLargeDark.png';
import InkBadge from '@/assets/badges/inkBadge.png';
import InkBadgeDark from '@/assets/badges/inkBadgeDark.png';
import InkBadgeLarge from '@/assets/badges/inkBadgeLarge.png';
import InkBadgeLargeDark from '@/assets/badges/inkBadgeLargeDark.png';
import LineaBadge from '@/assets/badges/lineaBadge.png';
import LineaBadgeDark from '@/assets/badges/lineaBadgeDark.png';
import LineaBadgeLarge from '@/assets/badges/lineaBadgeLarge.png';
import LineaBadgeLargeDark from '@/assets/badges/lineaBadgeLargeDark.png';
import OptimismBadge from '@/assets/badges/optimismBadge.png';
import OptimismBadgeDark from '@/assets/badges/optimismBadgeDark.png';
import OptimismBadgeLarge from '@/assets/badges/optimismBadgeLarge.png';
import OptimismBadgeLargeDark from '@/assets/badges/optimismBadgeLargeDark.png';
import PolygonBadge from '@/assets/badges/polygonBadge.png';
import PolygonBadgeDark from '@/assets/badges/polygonBadgeDark.png';
import PolygonBadgeLarge from '@/assets/badges/polygonBadgeLarge.png';
import PolygonBadgeLargeDark from '@/assets/badges/polygonBadgeLargeDark.png';
import SankoBadge from '@/assets/badges/sankoBadge.png';
import SankoBadgeLarge from '@/assets/badges/sankoBadgeLarge.png';
import SankoBadgeLargeDark from '@/assets/badges/sankoBadgeLargeDark.png';
import ScrollBadge from '@/assets/badges/scrollBadge.png';
import ScrollBadgeDark from '@/assets/badges/scrollBadgeDark.png';
import ScrollBadgeLarge from '@/assets/badges/scrollBadgeLarge.png';
import ScrollBadgeLargeDark from '@/assets/badges/scrollBadgeLargeDark.png';
import ZksyncBadge from '@/assets/badges/zkSyncBadge.png';
import ZksyncBadgeDark from '@/assets/badges/zksyncBadgeDark.png';
import ZksyncBadgeLarge from '@/assets/badges/zksyncBadgeLarge.png';
import ZksyncBadgeLargeDark from '@/assets/badges/zksyncBadgeLargeDark.png';
import ZoraBadge from '@/assets/badges/zoraBadge.png';
import ZoraBadgeDark from '@/assets/badges/zoraBadgeDark.png';
import ZoraBadgeLarge from '@/assets/badges/zoraBadgeLarge.png';
import ZoraBadgeLargeDark from '@/assets/badges/zoraBadgeLargeDark.png';

import { Centered } from '../layout';
import styled from '@/styled-thing';
import { position as positions } from '@/styles';
import { ChainBadgeSizeConfigs } from '@/components/coin-icon/ChainBadgeSizeConfigs';
import { ChainId } from '@/state/backendNetworks/types';

const ChainIcon = styled(FastImage)({
  height: ({ containerSize }) => containerSize,
  top: ({ iconSize }) => iconSize / 5,
  width: ({ containerSize }) => containerSize,
});

const IndicatorIconContainer = styled(Centered)(({ marginBottom, iconSize, badgeXPosition, badgeYPosition, position }) => ({
  bottom: position === 'relative' ? 0 : badgeYPosition,
  left: position === 'relative' ? 0 : badgeXPosition,
  ...positions.sizeAsObject(iconSize),
  elevation: 10,
  marginBottom,
  overflow: 'visible',
  position: position || 'absolute',
  zIndex: 10,
}));

export default function ChainBadge({
  chainId,
  badgeXPosition = -7,
  badgeYPosition = 0,
  marginBottom = 0,
  position = 'absolute',
  size = 'small',
  forceDark = false,
}) {
  const { isDarkMode: isDarkModeGlobal } = useTheme();
  const { containerSize, iconSize } = ChainBadgeSizeConfigs[size];

  const isDarkMode = forceDark ? true : isDarkModeGlobal;

  const source = useMemo(() => {
    let val = null;
    if (size === 'large') {
      if (chainId === ChainId.apechain) {
        val = isDarkMode ? ApechainBadgeLargeDark : ApechainBadgeLarge;
      } else if (chainId === ChainId.arbitrum) {
        val = isDarkMode ? ArbitrumBadgeLargeDark : ArbitrumBadgeLarge;
      } else if (chainId === ChainId.avalanche) {
        val = isDarkMode ? AvalancheBadgeLargeDark : AvalancheBadgeLarge;
      } else if (chainId === ChainId.base) {
        val = isDarkMode ? BaseBadgeLargeDark : BaseBadgeLarge;
      } else if (chainId === ChainId.blast) {
        val = isDarkMode ? BlastBadgeLargeDark : BlastBadgeLarge;
      } else if (chainId === ChainId.bsc) {
        val = isDarkMode ? BscBadgeLargeDark : BscBadgeLarge;
      } else if (chainId === ChainId.degen) {
        val = isDarkMode ? DegenBadgeLargeDark : DegenBadgeLarge;
      } else if (chainId === ChainId.gnosis) {
        val = isDarkMode ? GnosisBadgeLargeDark : GnosisBadgeLarge;
      } else if (chainId === ChainId.gravity) {
        val = isDarkMode ? GravityBadgeLargeDark : GravityBadgeLarge;
      } else if (chainId === ChainId.ink) {
        val = isDarkMode ? InkBadgeLargeDark : InkBadgeLarge;
      } else if (chainId === ChainId.linea) {
        val = isDarkMode ? LineaBadgeLargeDark : LineaBadgeLarge;
      } else if (chainId === ChainId.optimism) {
        val = isDarkMode ? OptimismBadgeLargeDark : OptimismBadgeLarge;
      } else if (chainId === ChainId.polygon) {
        val = isDarkMode ? PolygonBadgeLargeDark : PolygonBadgeLarge;
      } else if (chainId === ChainId.sanko) {
        val = isDarkMode ? SankoBadgeLargeDark : SankoBadgeLarge;
      } else if (chainId === ChainId.scroll) {
        val = isDarkMode ? ScrollBadgeLargeDark : ScrollBadgeLarge;
      } else if (chainId === ChainId.zksync) {
        val = isDarkMode ? ZksyncBadgeLargeDark : ZksyncBadgeLarge;
      } else if (chainId === ChainId.zora) {
        val = isDarkMode ? ZoraBadgeLargeDark : ZoraBadgeLarge;
      }
    } else {
      if (chainId === ChainId.apechain) {
        val = isDarkMode ? ApechainBadgeDark : ApechainBadge;
      } else if (chainId === ChainId.arbitrum) {
        val = isDarkMode ? ArbitrumBadgeDark : ArbitrumBadge;
      } else if (chainId === ChainId.avalanche) {
        val = isDarkMode ? AvalancheBadgeDark : AvalancheBadge;
      } else if (chainId === ChainId.base) {
        val = isDarkMode ? BaseBadgeDark : BaseBadge;
      } else if (chainId === ChainId.blast) {
        val = isDarkMode ? BlastBadgeDark : BlastBadge;
      } else if (chainId === ChainId.bsc) {
        val = isDarkMode ? BscBadgeDark : BscBadge;
      } else if (chainId === ChainId.degen) {
        val = isDarkMode ? DegenBadgeDark : DegenBadge;
      } else if (chainId === ChainId.gnosis) {
        val = isDarkMode ? GnosisBadgeDark : GnosisBadge;
      } else if (chainId === ChainId.gravity) {
        val = isDarkMode ? GravityBadgeDark : GravityBadge;
      } else if (chainId === ChainId.ink) {
        val = isDarkMode ? InkBadgeDark : InkBadge;
      } else if (chainId === ChainId.linea) {
        val = isDarkMode ? LineaBadgeDark : LineaBadge;
      } else if (chainId === ChainId.optimism) {
        val = isDarkMode ? OptimismBadgeDark : OptimismBadge;
      } else if (chainId === ChainId.polygon) {
        val = isDarkMode ? PolygonBadgeDark : PolygonBadge;
      } else if (chainId === ChainId.sanko) {
        val = SankoBadge;
      } else if (chainId === ChainId.scroll) {
        val = isDarkMode ? ScrollBadgeDark : ScrollBadge;
      } else if (chainId === ChainId.zksync) {
        val = isDarkMode ? ZksyncBadgeDark : ZksyncBadge;
      } else if (chainId === ChainId.zora) {
        val = isDarkMode ? ZoraBadgeDark : ZoraBadge;
      }
    }
    return val;
  }, [chainId, isDarkMode, size]);

  if (!source) return null;

  return (
    <IndicatorIconContainer
      badgeXPosition={badgeXPosition}
      badgeYPosition={badgeYPosition}
      iconSize={iconSize}
      marginBottom={marginBottom}
      position={position}
    >
      <ChainIcon containerSize={containerSize} iconSize={iconSize} source={source} />
    </IndicatorIconContainer>
  );
}
