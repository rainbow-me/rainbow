import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import ArbitrumBadge from '../assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '../assets/badges/arbitrumBadgeDark.png';
import ArbitrumBadgeNoShadow from '../assets/badges/arbitrumBadgeNoShadow.png';
import OptimismBadge from '../assets/badges/optimismBadge.png';
import OptimismBadgeDark from '../assets/badges/optimismBadgeDark.png';
import OptimismBadgeNoShadow from '../assets/badges/optimismBadgeNoShadow.png';
import PolygonBadge from '../assets/badges/polygonBadge.png';
import PolygonBadgeDark from '../assets/badges/polygonBadgeDark.png';
import PolygonBadgeNoShadow from '../assets/badges/polygonBadgeNoShadow.png';
import { Centered } from './layout';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { position } from '@rainbow-me/styles';

const ChainIcon = styled(FastImage)`
  height: ${({ size }) => size};
  margin-top: 1;
  width: ${({ size }) => size};
`;

const Content = styled(Centered)`
  ${({ size }) => position.size(size / 2)};
  overflow: visible;
`;

export default function ChainLogo({
  network,
  size = 40,
  withShadows = true,
  ...props
}) {
  const { isDarkMode } = useTheme();
  const source = useMemo(() => {
    let val = null;
    if (network === networkTypes.arbitrum) {
      val = withShadows
        ? isDarkMode
          ? ArbitrumBadgeDark
          : ArbitrumBadge
        : ArbitrumBadgeNoShadow;
    } else if (network === networkTypes.optimism) {
      val = withShadows
        ? isDarkMode
          ? OptimismBadgeDark
          : OptimismBadge
        : OptimismBadgeNoShadow;
    } else if (network === networkTypes.polygon) {
      val = withShadows
        ? isDarkMode
          ? PolygonBadgeDark
          : PolygonBadge
        : PolygonBadgeNoShadow;
    }
    return val;
  }, [isDarkMode, network, withShadows]);

  if (!source) return null;

  return (
    <Content size={size * 0.5} {...props}>
      <ChainIcon size={size} source={source} />
    </Content>
  );
}
