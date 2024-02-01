import React from 'react';
import FastImage from 'react-native-fast-image';
import ArbitrumBadge from '../../assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '../../assets/badges/arbitrumBadgeDark.png';
import OptimismBadge from '../../assets/badges/optimismBadge.png';
import OptimismBadgeDark from '../../assets/badges/optimismBadgeDark.png';
import PolygonBadge from '../../assets/badges/polygonBadge.png';
import PolygonBadgeDark from '../../assets/badges/polygonBadgeDark.png';
import BscBadge from '../../assets/badges/bscBadge.png';
import BscBadgeDark from '../../assets/badges/bscBadgeDark.png';
import { Centered } from '../layout';
import styled from '@/styled-thing';
import { Network } from '@/networks/types';

const sizeConfigs = {
  large: {
    iconSize: 60,
  },
  medium: {
    iconSize: 45,
  },
  small: {
    iconSize: 40,
  },
};

const Container = styled(Centered)(({ iconSize }) => ({
  borderRadius: iconSize / 2,
  height: iconSize / 2,
  overflow: 'visible',
  width: iconSize / 2,
}));

const Icon = styled(FastImage)(({ iconSize }) => ({
  height: iconSize,
  top: 4,
  width: iconSize,
}));

export default function ChainIcon({ network, size = 'small' }) {
  const { isDarkMode } = useTheme();

  const { iconSize } = sizeConfigs[size];

  const source = useMemo(() => {
    let val = null;
    if (network === Network.arbitrum) {
      val = isDarkMode ? ArbitrumBadgeDark : ArbitrumBadge;
    } else if (network === Network.optimism) {
      val = isDarkMode ? OptimismBadgeDark : OptimismBadge;
    } else if (network === Network.polygon) {
      val = isDarkMode ? PolygonBadgeDark : PolygonBadge;
    } else if (network === Network.bsc) {
      val = isDarkMode ? BscBadgeDark : BscBadge;
    }
    return val;
  }, [network, isDarkMode]);

  if (!source) return null;

  return (
    <Container iconSize={iconSize}>
      <Icon iconSize={iconSize} source={source} />
    </Container>
  );
}
