import React from 'react';
import styled from 'styled-components/primitives';
import { useOpenSmallBalances } from '../../hooks';
import { OpacityToggler } from '../animations';

const Content = styled.View.attrs(({ isSmallBalancesOpen }) => ({
  pointerEvents: isSmallBalancesOpen ? 'auto' : 'none',
}))`
  left: 0;
  margin-top: 13;
  opacity: ${({ isSmallBalancesOpen }) => (isSmallBalancesOpen ? 1 : 0)};
  position: absolute;
  right: 0;
`;

export default function SmallBalancesWrapper({ assets }) {
  const { isSmallBalancesOpen } = useOpenSmallBalances();

  return (
    <OpacityToggler
      endingOpacity={1}
      isVisible={isSmallBalancesOpen}
      startingOpacity={0}
    >
      <Content isSmallBalancesOpen={isSmallBalancesOpen}>{assets}</Content>
    </OpacityToggler>
  );
}
