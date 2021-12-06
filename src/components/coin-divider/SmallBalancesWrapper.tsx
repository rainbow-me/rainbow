import React from 'react';
import styled from 'styled-components';
import { OpacityToggler } from '../animations';
import { CoinRowHeight } from '../coin-row';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useFrameDelayedValue, useOpenSmallBalances } from '@rainbow-me/hooks';

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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container
      isVisible={!delayedIsSmallBalancesOpen}
      numberOfRows={assets.length}
    >
      {assets}
    </Container>
  );
}
