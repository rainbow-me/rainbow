import React from 'react';
import styled from 'styled-components/primitives';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { colors, position } from '../../styles';
import { OpacityToggler } from '../animations';
import { Text } from '../text';

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

export default function CoinDividerAssetsValue({
  assetsAmount,
  balancesSum,
  nativeCurrency,
  node,
  openSmallBalances,
}) {
  return (
    <Container
      animationNode={node}
      isVisible={openSmallBalances || assetsAmount === 0}
    >
      <ValueText>
        {convertAmountToNativeDisplay(balancesSum, nativeCurrency)}
      </ValueText>
    </Container>
  );
}
