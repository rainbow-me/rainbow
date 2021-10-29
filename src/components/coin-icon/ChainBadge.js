import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import ArbitrumBadge from '../../assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '../../assets/badges/arbitrumBadgeDark.png';
import ArbitrumBadgeLarge from '../../assets/badges/arbitrumBadgeLarge.png';
import ArbitrumBadgeLargeDark from '../../assets/badges/arbitrumBadgeLargeDark.png';
import OptimismBadge from '../../assets/badges/optimismBadge.png';
import OptimismBadgeDark from '../../assets/badges/optimismBadgeDark.png';
import OptimismBadgeLarge from '../../assets/badges/optimismBadgeLarge.png';
import OptimismBadgeLargeDark from '../../assets/badges/optimismBadgeLargeDark.png';
import PolygonBadge from '../../assets/badges/polygonBadge.png';
import PolygonBadgeDark from '../../assets/badges/polygonBadgeDark.png';
import PolygonBadgeLarge from '../../assets/badges/polygonBadgeLarge.png';
import PolygonBadgeLargeDark from '../../assets/badges/polygonBadgeLargeDark.png';
import { Centered } from '../layout';
import { AssetType } from '@rainbow-me/entities';
import { position } from '@rainbow-me/styles';

const sizeConfigs = {
  large: {
    containerSize: 64,
    iconSize: 40,
  },
  medium: {
    containerSize: 44,
    iconSize: 20,
  },
  small: {
    containerSize: 44,
    iconSize: 20,
  },
  tiny: {
    containerSize: 22,
    iconSize: 10,
  },
};

const ChainIcon = styled(FastImage)`
  height: ${({ containerSize }) => containerSize};
  top: ${({ iconSize }) => iconSize / 5};
  width: ${({ containerSize }) => containerSize};
`;

const IndicatorIconContainer = styled(Centered)`
  bottom: ${({ badgeYPosition, position }) =>
    position === 'relative' ? 0 : badgeYPosition};
  left: ${({ badgeXPosition, position }) =>
    position === 'relative' ? 0 : badgeXPosition};
  ${({ iconSize }) => position.size(iconSize)};
  margin-bottom: ${({ marginBottom }) => marginBottom};
  overflow: visible;
  position: ${({ position }) => position || 'absolute'};
  z-index: 10;
  elevation: 10;
`;

export default function ChainBadge({
  assetType,
  badgeXPosition = -7,
  badgeYPosition = 0,
  marginBottom = 0,
  position,
  size = 'small',
}) {
  const { isDarkMode } = useTheme();

  const { containerSize, iconSize } = sizeConfigs[size];

  const source = useMemo(() => {
    let val = null;
    if (size === 'large') {
      if (assetType === AssetType.arbitrum) {
        val = isDarkMode ? ArbitrumBadgeLargeDark : ArbitrumBadgeLarge;
      } else if (assetType === AssetType.optimism) {
        val = isDarkMode ? OptimismBadgeLargeDark : OptimismBadgeLarge;
      } else if (assetType === AssetType.polygon) {
        val = isDarkMode ? PolygonBadgeLargeDark : PolygonBadgeLarge;
      }
    } else {
      if (assetType === AssetType.arbitrum) {
        val = isDarkMode ? ArbitrumBadgeDark : ArbitrumBadge;
      } else if (assetType === AssetType.optimism) {
        val = isDarkMode ? OptimismBadgeDark : OptimismBadge;
      } else if (assetType === AssetType.polygon) {
        val = isDarkMode ? PolygonBadgeDark : PolygonBadge;
      }
    }
    return val;
  }, [assetType, isDarkMode, size]);

  if (!source) return null;

  return (
    <IndicatorIconContainer
      badgeXPosition={badgeXPosition}
      badgeYPosition={badgeYPosition}
      iconSize={iconSize}
      marginBottom={marginBottom}
      position={position}
    >
      <ChainIcon
        containerSize={containerSize}
        iconSize={iconSize}
        source={source}
      />
    </IndicatorIconContainer>
  );
}
