import React from 'react';
import styled from 'styled-components';
import BadgeSource from '../../assets/optimismBadge.png';
import { Centered } from '../layout';
import { ImgixImage } from '@rainbow-me/images';
import { borders } from '@rainbow-me/styles';

const BadgeIcon = styled(ImgixImage).attrs({
  source: BadgeSource,
})`
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
export default function OptimismBadge({ badgeYPosition, badgeXPosition }) {
  return (
    <IndicatorIconContainer
      badgeXPosition={badgeXPosition}
      badgeYPosition={badgeYPosition}
    >
      <BadgeIcon />
    </IndicatorIconContainer>
  );
}
