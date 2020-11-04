import React from 'react';
import { BaseButton } from 'react-native-gesture-handler';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components/primitives';
import { Centered } from '../layout';
import { Text } from '../text';
import { CoinRowHeight } from './CoinRow';
import { colors, padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const FavoriteButtonPadding = 19;

const FavoriteButton = styled(Centered)`
  ${padding(0, FavoriteButtonPadding)};
  bottom: 0;
  flex: 0;
  height: ${CoinRowHeight};
  position: absolute;
  right: 0;
  top: 0;
  width: 68px;
`;

const Circle = styled(RadialGradient).attrs(({ isFavorited }) => ({
  center: [0, 15],
  colors: isFavorited
    ? [colors.alpha('#FFB200', 0), colors.alpha('#FFB200', 0.2)]
    : ['#FFFFFF', '#F2F4F7'],
}))`
  border-radius: 15px;
  height: 30px;
  overflow: hidden;
  width: 30px;
`;

const StarIcon = styled(Text).attrs(({ isFavorited }) => ({
  align: 'center',
  color: isFavorited ? '#FFB200' : colors.alpha(colors.blueGreyDark, 0.2),
  letterSpacing: 'zero',
  size: 'smaller',
  weight: 'heavy',
}))`
  height: 100%;
  line-height: 28px;
  width: 100%;
`;

const CoinRowFavoriteButton = ({ isFavorited, onPress }) => (
  <FavoriteButton as={BaseButton} onPress={onPress}>
    <Circle isFavorited={isFavorited}>
      <StarIcon isFavorited={isFavorited}>􀋃</StarIcon>
    </Circle>
  </FavoriteButton>
);

export default magicMemo(CoinRowFavoriteButton, 'isFavorited');
