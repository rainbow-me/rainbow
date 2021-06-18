import React from 'react';
import styled from 'styled-components';
import ArbitrumBadge from '../../assets/badges/arbitrumBadge.png';
import ArbitrumBadgeDark from '../../assets/badges/arbitrumBadgeDark.png';
import OptimismBadge from '../../assets/badges/optimismBadge.png';
import OptimismBadgeDark from '../../assets/badges/optimismBadgeDark.png';
import PolygonBadge from '../../assets/badges/polygonBadge.png';
import PolygonBadgeDark from '../../assets/badges/polygonBadgeDark.png';
import { Centered } from '../layout';
import { AssetType } from '@rainbow-me/entities';
import { ImgixImage } from '@rainbow-me/images';
import { borders } from '@rainbow-me/styles';

const ChainIcon = styled(ImgixImage)`
  height: 20;
  margin-top: 1;
  width: 20;
`;

const IndicatorIconContainer = styled(Centered)`
  ${borders.buildCircle(40)};
  bottom: ${({ badgeYPosition }) => badgeYPosition || -5};
  left: ${({ badgeXPosition }) => badgeXPosition || 7};
  position: absolute;
  z-index: 10;
`;
export default function ChainBadge({
  assetType,
  badgeYPosition,
  badgeXPosition,
}) {
  const { isDarkMode } = useTheme();
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
    >
      <ChainIcon source={source} />
    </IndicatorIconContainer>
  );
}
