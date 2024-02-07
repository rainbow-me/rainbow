import React from 'react';
import { View } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import RadialGradient from 'react-native-radial-gradient';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { CoinRowHeight } from './CoinRow';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { magicMemo } from '@/utils';

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

const Circle = styled(IS_TESTING === 'true' ? View : RadialGradient).attrs(({ theme: { colors } }) => ({
  center: [0, 15],
  colors: colors.gradients.lightestGrey,
}))({
  borderRadius: 15,
  height: 30,
  overflow: 'hidden',
  width: 30,
});

const Icon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.3),
  letterSpacing: 'zero',
  size: 'lmedium',
  weight: 'bold',
}))({
  height: '100%',
  lineHeight: 29,
  width: '100%',
});

const CoinRowAddButton = ({ onPress }) => (
  <AddButton>
    <ButtonPressAnimation onPress={onPress}>
      <Circle>
        <Icon>􀅼</Icon>
      </Circle>
    </ButtonPressAnimation>
  </AddButton>
);

export default magicMemo(CoinRowAddButton, 'isFavorited');
