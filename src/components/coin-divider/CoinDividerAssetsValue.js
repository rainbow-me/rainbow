import React from 'react';
import styled from 'styled-components';
import { withThemeContext } from '../../context/ThemeContext';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { OpacityToggler } from '../animations';
import { Text } from '../text';
import { position } from '@rainbow-me/styles';

const Container = styled(OpacityToggler)`
  ${position.centered};
  height: 30;
`;

const ValueText = withThemeContext(styled(Text).attrs(({ colors }) => ({
  align: 'right',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  size: 'lmedium',
}))`
  padding-bottom: 1;
`);

const CoinDividerAssetsValue = ({
  balancesSum,
  nativeCurrency,
  openSmallBalances,
}) => (
  <Container isVisible={openSmallBalances}>
    <ValueText>
      {convertAmountToNativeDisplay(balancesSum, nativeCurrency)}
    </ValueText>
  </Container>
);

export default React.memo(CoinDividerAssetsValue);
