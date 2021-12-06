import React from 'react';
import styled from 'styled-components';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { OpacityToggler } from '../animations';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const Container = styled(OpacityToggler)`
  ${position.centered};
  height: 30;
`;

const ValueText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'right',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  size: 'lmedium',
}))`
  padding-bottom: 1;
`;

const CoinDividerAssetsValue = ({
  balancesSum,
  nativeCurrency,
  openSmallBalances,
}: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Container isVisible={openSmallBalances}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <ValueText>
      {convertAmountToNativeDisplay(balancesSum, nativeCurrency)}
    </ValueText>
  </Container>
);

export default React.memo(CoinDividerAssetsValue);
