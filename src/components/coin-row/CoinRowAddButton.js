import React from 'react';
import { BaseButton } from 'react-native-gesture-handler';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components/primitives';
import { Centered } from '../layout';
import { Text } from '../text';
import { CoinRowHeight } from './CoinRow';
import { colors, padding } from '@rainbow-me/styles';
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

const Circle = styled(RadialGradient).attrs({
  center: [0, 15],
  colors: ['#FFFFFF', '#F2F4F7'],
})`
  border-radius: 15px;
  height: 30px;
  overflow: hidden;
  width: 30px;
`;

const Icon = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.2),
  letterSpacing: 'zero',
  size: 'smaller',
  weight: 'heavy',
})`
  height: 100%;
  line-height: 28px;
  width: 100%;
`;

const CoinRowAddButton = ({ onPress }) => (
  <AddButton as={BaseButton} onPress={onPress}>
    <Circle>
      <Icon>􀅼</Icon>
    </Circle>
  </AddButton>
);

export default magicMemo(CoinRowAddButton, 'isFavorited');
