import React from 'react';
import styled from 'styled-components/primitives';
import { useOpenSmallBalances } from '../../hooks';
import { OpacityToggler } from '../animations';
import { CoinRowHeight } from '../coin-row';

const Container = styled(OpacityToggler).attrs(({ isVisible }) => ({
  pointerEvents: isVisible ? 'none' : 'auto',
}))`
  height: ${({ numberOfRows }) => numberOfRows * CoinRowHeight};
  margin-top: 13;
`;

export default function SmallBalancesWrapper({ assets = [] }) {
  const { isSmallBalancesOpen } = useOpenSmallBalances();

  return (
    <Container isVisible={!isSmallBalancesOpen} numberOfRows={assets.length}>
      {assets}
    </Container>
  );
}
