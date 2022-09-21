import React from 'react';
import { Centered, Column } from '../layout';
import { Text } from '../text';
import { CoinRowHeight } from './CoinRow';
import styled from '@/styled-thing';
import { padding } from '@/styles';

const AddButtonPadding = 19;

const AddButton = styled(Centered)({
  ...padding.object(0, AddButtonPadding),
  bottom: 0,
  flex: 0,
  height: CoinRowHeight,
  position: 'absolute',
  right: 0,
  top: 0,
  width: 68,
});

const Icon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.2),
  letterSpacing: 'zero',
  size: 'larger',
  weight: 'normal',
}))({
  height: '100%',
  lineHeight: 28,
  marginTop: 28,
  width: '100%',
});

const CoinRowDetailsIcon = () => (
  <AddButton as={Column}>
    <Icon>􀁴</Icon>
  </AddButton>
);

export default CoinRowDetailsIcon;
