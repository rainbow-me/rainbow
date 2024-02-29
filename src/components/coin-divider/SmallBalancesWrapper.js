import React from 'react';
import { OpacityToggler } from '../animations';
import { CoinRowHeight } from '../coin-row';
import { useFrameDelayedValue, useOpenSmallBalances } from '@/hooks';
import styled from '@/styled-thing';

const Container = styled(OpacityToggler).attrs(({ isVisible }) => ({
  pointerEvents: isVisible ? 'none' : 'auto',
}))({
  height: ({ numberOfRows }) => numberOfRows * CoinRowHeight,
  marginTop: 13,
});

export default function SmallBalancesWrapper({ assets = [] }) {
  const { isSmallBalancesOpen } = useOpenSmallBalances();
  // wait until refresh of RLV
  const delayedIsSmallBalancesOpen = useFrameDelayedValue(isSmallBalancesOpen) && isSmallBalancesOpen;

  return (
    <Container isVisible={!delayedIsSmallBalancesOpen} numberOfRows={assets.length}>
      {assets}
    </Container>
  );
}
