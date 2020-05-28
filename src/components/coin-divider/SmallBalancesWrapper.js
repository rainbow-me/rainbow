import React from 'react';
import styled from 'styled-components/primitives';
import { useOpenSmallBalances } from '../../hooks';
import { OpacityToggler } from '../animations';
import { CoinRowHeight } from '../coin-row';

const Container = styled(OpacityToggler).attrs(({ isVisible }) => ({
  endingOpacity: 1,
  pointerEvents: isVisible ? 'auto' : 'none',
  startingOpacity: 0,
}))`
  height: ${({ numberOfRows }) => numberOfRows * CoinRowHeight};
  margin-top: 13;
`;

export default function SmallBalancesWrapper({ assets = [] }) {
  const { isSmallBalancesOpen } = useOpenSmallBalances();

  return (
    <Container isVisible={isSmallBalancesOpen} numberOfRows={assets.length}>
      {assets}
    </Container>
  );
}
