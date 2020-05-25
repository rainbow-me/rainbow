import React from 'react';
import { BaseButton } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../styles';
import { magicMemo } from '../../utils';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { CoinRowHeight } from './CoinRow';

const FavoriteButtonPadding = 19;
const FavoriteButtonWidth = FavoriteButtonPadding * 3;

const Button = styled(BaseButton)`
  ${position.centered};
  ${padding(0, FavoriteButtonPadding)}
  bottom: 0;
  flex: 0;
  height: ${CoinRowHeight};
  position: absolute;
  right: 0;
  top: 0;
  width: ${FavoriteButtonWidth};
`;

const CoinRowFavoriteButton = ({ isFavorited, onPress }) => (
  <Button onPress={onPress}>
    <Centered {...position.sizeAsObject('100%')}>
      <Icon
        color={
          isFavorited ? colors.yellow : colors.alpha(colors.blueGreyDark, 0.12)
        }
        name="star"
      />
    </Centered>
  </Button>
);

export default magicMemo(CoinRowFavoriteButton, 'isFavorited');
