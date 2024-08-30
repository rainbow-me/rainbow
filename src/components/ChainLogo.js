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
import networkTypes from '@/helpers/networkTypes';
import styled from '@/styled-thing';
import { position } from '@/styles';

const ChainIcon = styled(FastImage)({
  height: ({ size }) => size,
  top: ({ size }) => (size * 20) / 44 / 5,
  width: ({ size }) => size,
});

const Content = styled(Centered)(({ size }) => ({
  ...position.sizeAsObject((size * 20) / 44),
  overflow: 'visible',
}));

export default function ChainLogo({ network, size = 44, withShadows = true, ...props }) {
  const { isDarkMode } = useTheme();
  const source = useMemo(() => {
    let val = null;
    if (network === networkTypes.arbitrum) {
      val = withShadows ? (isDarkMode ? ArbitrumBadgeDark : ArbitrumBadge) : ArbitrumBadgeNoShadow;
    } else if (network === networkTypes.optimism) {
      val = withShadows ? (isDarkMode ? OptimismBadgeDark : OptimismBadge) : OptimismBadgeNoShadow;
    } else if (network === networkTypes.polygon) {
      val = withShadows ? (isDarkMode ? PolygonBadgeDark : PolygonBadge) : PolygonBadgeNoShadow;
    } else if (network === networkTypes.bsc) {
      val = withShadows ? (isDarkMode ? BscBadgeDark : BscBadge) : BscBadgeNoShadow;
    } else if (network === networkTypes.zora) {
      val = withShadows ? (isDarkMode ? ZoraBadgeDark : ZoraBadge) : ZoraBadgeNoShadow;
    } else if (network === networkTypes.base) {
      val = withShadows ? (isDarkMode ? BaseBadgeDark : BaseBadge) : BaseBadgeNoShadow;
    }
    return val;
  }, [isDarkMode, network, withShadows]);

  if (!source) return null;

  return (
    <Content size={size} {...props}>
      <ChainIcon size={size} source={source} />
    </Content>
  );
}
