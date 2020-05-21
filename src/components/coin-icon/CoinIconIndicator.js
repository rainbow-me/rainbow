import React from 'react';
import styled from 'styled-components/primitives';
import { borders, colors, shadow } from '../../styles';
import { Icon } from '../icons';
import { Centered } from '../layout';

const IndicatorIcon = styled(Icon).attrs(({ isPinned }) => ({
  color: colors.white,
  name: isPinned ? 'pin' : 'hidden',
}))`
  height: ${({ isPinned }) => (isPinned ? 13 : 10)};
  margin-top: ${({ isPinned }) => (isPinned ? 1 : 0)};
  width: ${({ isPinned }) => (isPinned ? 8 : 14)};
`;

const IndicatorIconContainer = styled(Centered)`
  ${borders.buildCircle(20)};
  ${shadow.build(0, 4, 6, colors.blueGreyDark, 0.4)}
  background-color: ${colors.blueGreyDark50};
  bottom: 3;
  left: 10;
  position: absolute;
  z-index: 10;
`;

export default function CoinIconIndicator({ isPinned }) {
  return (
    <IndicatorIconContainer>
      <IndicatorIcon isPinned={isPinned} />
    </IndicatorIconContainer>
  );
}
