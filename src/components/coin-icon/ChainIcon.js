import React from 'react';
import FastImage from 'react-native-fast-image';
import ArbitrumBadge from '../../assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '../../assets/badges/arbitrumBadgeDark.png';
import OptimismBadge from '../../assets/badges/optimismBadge.png';
import OptimismBadgeDark from '../../assets/badges/optimismBadgeDark.png';
import PolygonBadge from '../../assets/badges/polygonBadge.png';
import PolygonBadgeDark from '../../assets/badges/polygonBadgeDark.png';
import { Centered } from '../layout';
import { AssetType } from '@rainbow-me/entities';
import styled from '@rainbow-me/styled-components';

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

export default function ChainIcon({ assetType, size = 'small' }) {
  const { isDarkMode } = useTheme();

  const { iconSize } = sizeConfigs[size];

  const source = useMemo(() => {
    let val = null;
    if (assetType === AssetType.arbitrum) {
      val = isDarkMode ? ArbitrumBadgeDark : ArbitrumBadge;
    } else if (assetType === AssetType.optimism) {
      val = isDarkMode ? OptimismBadgeDark : OptimismBadge;
    } else if (assetType === AssetType.polygon) {
      val = isDarkMode ? PolygonBadgeDark : PolygonBadge;
    }
    return val;
  }, [assetType, isDarkMode]);

  if (!source) return null;

  return (
    <Container iconSize={iconSize}>
      <Icon iconSize={iconSize} source={source} />
    </Container>
  );
}
