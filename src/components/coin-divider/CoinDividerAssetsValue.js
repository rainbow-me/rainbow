import React from 'react';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import OpacityToggler from '../animations/OpacityToggler';
import { Text } from '../text';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { opacity } from '@/framework/ui/utils/opacity';

const Container = styled(OpacityToggler)({
  height: 30,
  ...position.centeredAsObject,
});

const ValueText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'right',
  color: opacity(colors.blueGreyDark, 0.6),
  size: 'lmedium',
  weight: 'medium',
}))({
  paddingBottom: 1,
});

const CoinDividerAssetsValue = ({ balancesSum, nativeCurrency, openSmallBalances }) => (
  <Container isVisible={openSmallBalances}>
    <ValueText>{convertAmountToNativeDisplay(balancesSum, nativeCurrency)}</ValueText>
  </Container>
);

export default React.memo(CoinDividerAssetsValue);
