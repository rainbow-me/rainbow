import React from 'react';
import FastImage from 'react-native-fast-image';
import ArbitrumBadge from '../assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '../assets/badges/arbitrumBadgeDark.png';
import ArbitrumBadgeNoShadow from '../assets/badges/arbitrumBadgeNoShadow.png';
import OptimismBadge from '../assets/badges/optimismBadge.png';
import OptimismBadgeDark from '../assets/badges/optimismBadgeDark.png';
import OptimismBadgeNoShadow from '../assets/badges/optimismBadgeNoShadow.png';
import PolygonBadge from '../assets/badges/polygonBadge.png';
import PolygonBadgeDark from '../assets/badges/polygonBadgeDark.png';
import PolygonBadgeNoShadow from '../assets/badges/polygonBadgeNoShadow.png';
import BscBadge from '../assets/badges/bscBadge.png';
import BscBadgeDark from '../assets/badges/bscBadgeDark.png';
import BscBadgeNoShadow from '../assets/badges/bscBadgeNoShadow.png';
import ZoraBadge from '../assets/badges/zoraBadge.png';
import ZoraBadgeDark from '../assets/badges/zoraBadgeDark.png';
import ZoraBadgeNoShadow from '../assets/badges/zoraBadgeNoShadow.png';
import BaseBadge from '../assets/badges/baseBadge.png';
import BaseBadgeDark from '../assets/badges/baseBadgeDark.png';
import BaseBadgeNoShadow from '../assets/badges/baseBadgeNoShadow.png';
import { Centered } from './layout';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { ChainId } from '@/state/backendNetworks/types';

const ChainIcon = styled(FastImage)({
  height: ({ size }) => size,
  top: ({ size }) => (size * 20) / 44 / 5,
  width: ({ size }) => size,
});

const Content = styled(Centered)(({ size }) => ({
  ...position.sizeAsObject((size * 20) / 44),
  overflow: 'visible',
}));

export default function ChainLogo({ chainId, size = 44, withShadows = true, ...props }) {
  const { isDarkMode } = useTheme();
  const source = useMemo(() => {
    let val = null;
    if (chainId === ChainId.arbitrum) {
      val = withShadows ? (isDarkMode ? ArbitrumBadgeDark : ArbitrumBadge) : ArbitrumBadgeNoShadow;
    } else if (chainId === ChainId.optimism) {
      val = withShadows ? (isDarkMode ? OptimismBadgeDark : OptimismBadge) : OptimismBadgeNoShadow;
    } else if (chainId === ChainId.polygon) {
      val = withShadows ? (isDarkMode ? PolygonBadgeDark : PolygonBadge) : PolygonBadgeNoShadow;
    } else if (chainId === ChainId.bsc) {
      val = withShadows ? (isDarkMode ? BscBadgeDark : BscBadge) : BscBadgeNoShadow;
    } else if (chainId === ChainId.zora) {
      val = withShadows ? (isDarkMode ? ZoraBadgeDark : ZoraBadge) : ZoraBadgeNoShadow;
    } else if (chainId === ChainId.base) {
      val = withShadows ? (isDarkMode ? BaseBadgeDark : BaseBadge) : BaseBadgeNoShadow;
    }
    return val;
  }, [isDarkMode, chainId, withShadows]);

  if (!source) return null;

  return (
    <Content size={size} {...props}>
      <ChainIcon size={size} source={source} />
    </Content>
  );
}
