import React from 'react';
import styled from 'styled-components/primitives';
import { Centered, Column } from '../layout';
import { Text } from '../text';
import { CoinRowHeight } from './CoinRow';
import { colors, padding } from '@rainbow-me/styles';

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

const Icon = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.2),
  letterSpacing: 'zero',
  size: 'larger',
  weight: 'normal',
})`
  height: 100%;
  line-height: 28px;
  width: 100%;
  margin-top: 28px;
`;

const CoinRowAddIcon = () => (
  <AddButton as={Column}>
    <Icon>􀁴</Icon>
  </AddButton>
);

export default CoinRowAddIcon;
