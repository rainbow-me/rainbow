import React from 'react';
import styled from 'styled-components/primitives';
import { useFrameDelayedValue, useOpenSmallBalances } from '../../hooks';
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
  // wait until refresh of RLV
  const delayedIsSmallBalancesOpen =
    useFrameDelayedValue(isSmallBalancesOpen) && isSmallBalancesOpen;

  return (
    <Container
      isVisible={!delayedIsSmallBalancesOpen}
      numberOfRows={assets.length}
    >
      {assets}
    </Container>
  );
}
