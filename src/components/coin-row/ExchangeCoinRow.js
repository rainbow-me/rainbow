import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { uniswapUpdateFavorites } from '../../redux/uniswap';
import { colors, position } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Monospace } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const BottomRow = ({ symbol }) => (
  <Monospace color={colors.alpha(colors.blueGreyDark, 0.6)} size="smedium">
    {symbol}
  </Monospace>
);

BottomRow.propTypes = {
  balance: PropTypes.shape({ display: PropTypes.string }),
  symbol: PropTypes.string,
};

const TopRow = ({ name }) => <CoinName>{name}</CoinName>;

TopRow.propTypes = {
  name: PropTypes.string,
};

class ExchangeCoinRow extends Component {
  static propTypes = {
    index: PropTypes.number,
    item: PropTypes.shape({
      address: PropTypes.string,
      favorite: PropTypes.bool,
      symbol: PropTypes.string,
    }),
    onPress: PropTypes.func,
    uniqueId: PropTypes.string,
    uniswapUpdateFavorites: PropTypes.func,
  };

  state = {
    favorite: !!this.props.item.favorite,
  };

  shouldComponentUpdate = (nextProps, nextState) => {
    const isNewAsset = isNewValueForPath(this.props, nextProps, 'uniqueId');
    const isNewFavorite = isNewValueForPath(this.state, nextState, 'favorite');

    return isNewAsset || isNewFavorite;
  };

  handlePress = () => {
    const { item, onPress } = this.props;

    if (onPress) {
      onPress(item);
    }
  };

  toggleFavorite = () => {
    const { item, uniswapUpdateFavorites } = this.props;
    this.setState(prevState => {
      const favorite = !prevState.favorite;
      uniswapUpdateFavorites(item.address, favorite);
      return { favorite };
    });
  };

  render = () => {
    const { item, ...props } = this.props;
    const { favorite } = this.state;

    return (
      <ButtonPressAnimation
        {...props}
        height={CoinRow.height}
        onPress={this.handlePress}
        scaleTo={0.96}
      >
        <CoinRow
          {...item}
          bottomRowRender={BottomRow}
          containerStyles="padding-right: 0"
          topRowRender={TopRow}
        >
          <ButtonPressAnimation
            exclusive
            onPress={this.toggleFavorite}
            scaleTo={0.69}
            style={{
              ...position.centeredAsObject,
              paddingHorizontal: 19,
            }}
          >
            <Icon
              color={favorite ? colors.orangeLight : '#E2E3E5'}
              name="star"
            />
          </ButtonPressAnimation>
        </CoinRow>
      </ButtonPressAnimation>
    );
  };
}

export default connect(
  null,
  { uniswapUpdateFavorites }
)(ExchangeCoinRow);
