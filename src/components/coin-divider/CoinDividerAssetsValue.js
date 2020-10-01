import React from 'react';
import styled from 'styled-components/primitives';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { OpacityToggler } from '../animations';
import { Text } from '../text';
import { colors, position } from '@rainbow-me/styles';

const Container = styled(OpacityToggler)`
  ${position.centered};
  height: 30;
`;

const ValueText = styled(Text).attrs({
  align: 'right',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  size: 'lmedium',
})`
  padding-bottom: 1;
`;

const CoinDividerAssetsValue = ({
  assetsAmount,
  balancesSum,
  nativeCurrency,
  openSmallBalances,
}) => (
  <Container isVisible={openSmallBalances || assetsAmount === 0}>
    <ValueText>
      {convertAmountToNativeDisplay(balancesSum, nativeCurrency)}
    </ValueText>
  </Container>
);

export default React.memo(CoinDividerAssetsValue);
