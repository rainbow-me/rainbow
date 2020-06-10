import React from 'react';
import styled from 'styled-components/primitives';
import { useOpenSmallBalances } from '../../hooks';
import { OpacityToggler } from '../animations';
import { CoinRowHeight } from '../coin-row';

const Content = styled.View.attrs(({ isSmallBalancesOpen }) => ({
  pointerEvents: isSmallBalancesOpen ? 'auto' : 'none',
}))`
  height: ${({ numberOfRows }) => numberOfRows * CoinRowHeight};
  margin-top: 13;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
`;

export default function SmallBalancesWrapper({ assets = [] }) {
  const { isSmallBalancesOpen } = useOpenSmallBalances();

  return (
    <OpacityToggler
      endingOpacity={1}
      isVisible={isSmallBalancesOpen}
      startingOpacity={0}
    >
      <Content isOpen={isSmallBalancesOpen} numberOfRows={assets.length}>
        {assets}
      </Content>
    </OpacityToggler>
  );
}
