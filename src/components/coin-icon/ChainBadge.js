import React from 'react';
import styled from 'styled-components';
import OptimismBadge from '../../assets/optimismBadge.png';
import PolygonBadge from '../../assets/polygonBadge.png';
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
  left: ${({ badgeXPosition }) => badgeXPosition || 30};
  position: absolute;
  z-index: 10;
`;
export default function ChainBadge({
  assetType,
  badgeYPosition,
  badgeXPosition,
}) {
  const source = useMemo(() => {
    let val = null;
    if (assetType === AssetType.optimism) {
      val = OptimismBadge;
    } else if (assetType === AssetType.polygon) {
      val = PolygonBadge;
    }
    return val;
  }, [assetType]);

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
