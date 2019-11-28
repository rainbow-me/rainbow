import PropTypes from 'prop-types';
import React from 'react';
import { BaseButton } from 'react-native-gesture-handler';
import { colors, padding, position } from '../../styles';
import { Icon } from '../icons';
import { Centered } from '../layout';
import CoinRow from './CoinRow';

const FavoriteButtonPadding = 19;
const FavoriteButtonWidth = FavoriteButtonPadding * 3;

const CoinRowFavoriteButton = ({ isFavorited, onPress }) => (
  <BaseButton
    {...position.centeredAsObject}
    css={`
      ${padding(0, FavoriteButtonPadding)}
      bottom: 0;
      flex: 0;
      height: ${CoinRow.height}
      position: absolute;
      right: 0;
      top: 0;
      width: ${FavoriteButtonWidth};
    `}
    onPress={onPress}
  >
    <Centered {...position.sizeAsObject('100%')}>
      <Icon color={isFavorited ? colors.orangeLight : '#E2E3E5'} name="star" />
    </Centered>
  </BaseButton>
);

CoinRowFavoriteButton.propTypes = {
  isFavorited: PropTypes.bool,
  onPress: PropTypes.func,
};

export default React.memo(CoinRowFavoriteButton);
