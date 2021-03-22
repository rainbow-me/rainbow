import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { CoinRowHeight } from './CoinRow';
import { padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

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

const Circle = styled(RadialGradient).attrs(({ theme: { colors } }) => ({
  center: [0, 15],
  colors: colors.gradients.lightestGrey,
}))`
  border-radius: 15px;
  height: 30px;
  overflow: hidden;
  width: 30px;
`;

const Icon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.3),
  letterSpacing: 'zero',
  size: 'lmedium',
  weight: 'bold',
}))`
  height: 100%;
  line-height: 29px;
  width: 100%;
`;

const CoinRowAddButton = ({ onPress }) => (
  <AddButton as={ButtonPressAnimation} onPress={onPress}>
    <Circle>
      <Icon>􀅼</Icon>
    </Circle>
  </AddButton>
);

export default magicMemo(CoinRowAddButton, 'isFavorited');
