import React from 'react';
import { BaseButton } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { CoinRowHeight } from './CoinRow';
import { colors, padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const FavoriteButtonPadding = 19;
const FavoriteButtonWidth = FavoriteButtonPadding * 3;

const FavoriteButton = styled(Centered)`
  ${padding(0, FavoriteButtonPadding)};
  bottom: 0;
  flex: 0;
  height: ${CoinRowHeight};
  position: absolute;
  right: 0;
  top: 0;
  width: ${FavoriteButtonWidth};
`;

const StarIcon = styled(Icon).attrs(({ isFavorited }) => ({
  color: isFavorited ? colors.yellow : colors.alpha(colors.blueGreyDark, 0.12),
  name: 'star',
}))``;

const CoinRowFavoriteButton = ({ isFavorited, onPress }) => (
  <FavoriteButton as={BaseButton} onPress={onPress}>
    <StarIcon isFavorited={isFavorited} />
  </FavoriteButton>
);

export default magicMemo(CoinRowFavoriteButton, 'isFavorited');
