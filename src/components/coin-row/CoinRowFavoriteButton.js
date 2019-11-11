import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
import CoinRow from './CoinRow';

const FavoriteButtonPadding = 19;
const FavoriteButtonWidth = FavoriteButtonPadding * 3;

const Container = styled(Centered).attrs({ flex: 0 })`
  ${padding(0, FavoriteButtonPadding)}
  bottom: 0;
  height: ${CoinRow.height}
  position: absolute;
  right: 0;
  top: 0;
  width: ${FavoriteButtonWidth};
`;

const CoinRowFavoriteButton = ({ isFavorited, onPress }) => (
  <Container>
    <ButtonPressAnimation
      exclusive
      flex={0}
      onPress={onPress}
      scaleTo={0.69}
      width={FavoriteButtonWidth}
    >
      <Centered {...position.sizeAsObject('100%')}>
        <Icon
          color={isFavorited ? colors.orangeLight : '#E2E3E5'}
          name="star"
        />
      </Centered>
    </ButtonPressAnimation>
  </Container>
);

CoinRowFavoriteButton.propTypes = {
  isFavorited: PropTypes.bool,
  onPress: PropTypes.func,
};

export default React.memo(CoinRowFavoriteButton);
