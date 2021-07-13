import React from 'react';
import styled from 'styled-components';
import { Centered, Column } from '../layout';
import { Text } from '../text';
import { CoinRowHeight } from './CoinRow';
import { padding } from '@rainbow-me/styles';

const AddButtonPadding = 19;

const AddButton = styled(Centered)`
  ${padding(0, AddButtonPadding)};
  bottom: 0;
  flex: 0;
  height: ${CoinRowHeight};
  position: absolute;
  right: 0;
  top: 0;
  width: 68px;
`;

const Icon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.2),
  letterSpacing: 'zero',
  size: 'larger',
  weight: 'normal',
}))`
  height: 100%;
  line-height: 28px;
  width: 100%;
  margin-top: 28px;
`;

const CoinRowDetailsIcon = () => (
  <AddButton as={Column}>
    <Icon>􀁴</Icon>
  </AddButton>
);

export default CoinRowDetailsIcon;
