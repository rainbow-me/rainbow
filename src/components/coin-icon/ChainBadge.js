import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components';
import ArbitrumBadge from '../../assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '../../assets/badges/arbitrumBadgeDark.png';
import OptimismBadge from '../../assets/badges/optimismBadge.png';
import OptimismBadgeDark from '../../assets/badges/optimismBadgeDark.png';
import PolygonBadge from '../../assets/badges/polygonBadge.png';
import PolygonBadgeDark from '../../assets/badges/polygonBadgeDark.png';
import { Centered } from '../layout';
import { AssetType } from '@rainbow-me/entities';
import { borders } from '@rainbow-me/styles';

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

const ChainIcon = styled(FastImage)`
  height: ${({ iconSize }) => iconSize};
  margin-top: 1;
  width: ${({ iconSize }) => iconSize};
`;

const IndicatorIconContainer = styled(Centered)`
  ${({ iconSize }) => borders.buildCircle(iconSize)};
  bottom: ${({ badgeYPosition }) => badgeYPosition || -4};
  left: ${({ badgeXPosition }) => badgeXPosition || 2};
  position: absolute;
  z-index: 10;
`;
export default function ChainBadge({
  assetType,
  badgeYPosition,
  badgeXPosition,
  size = 'small',
}) {
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
    <IndicatorIconContainer
      badgeXPosition={badgeXPosition}
      badgeYPosition={badgeYPosition}
      iconSize={iconSize}
    >
      <ChainIcon iconSize={iconSize} source={source} />
    </IndicatorIconContainer>
  );
}
