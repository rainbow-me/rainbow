import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { css } from 'styled-components/primitives';
import { uniswapUpdateFavorites } from '../../redux/uniswap';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import CoinRowFavoriteButton from './CoinRowFavoriteButton';

const containerStyles = css`
  padding-left: 15;
  padding-right: 0;
`;

const BottomRow = ({ balance, native, showBalance, symbol }) => {
  let text = symbol;
  if (showBalance && native) {
    text = `${balance.display} ≈ ${native.balance.display}`;
  } else if (showBalance) {
    text = `${balance.display}`;
  }
  return <BottomRowText>{text}</BottomRowText>;
};

const balanceShape = {
  balance: PropTypes.shape({ display: PropTypes.string }),
};

BottomRow.propTypes = {
  ...balanceShape,
  native: PropTypes.shape(balanceShape),
  showBalance: PropTypes.bool,
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
    showBalance: PropTypes.bool,
    showFavoriteButton: PropTypes.bool,
    uniqueId: PropTypes.string,
    uniswapUpdateFavorites: PropTypes.func,
  };

  state = {
    localFavorite: false,
  };

  shouldComponentUpdate = (nextProps, nextState) => {
    const isNewAsset = isNewValueForPath(this.props, nextProps, 'uniqueId');
    const isNewFavorite = isNewValueForPath(
      this.state,
      nextState,
      'localFavorite'
    );

    return isNewAsset || isNewFavorite;
  };

  handlePress = () => {
    if (this.props.onPress) {
      this.props.onPress(this.props.item);
    }
  };

  toggleFavorite = () => {
    const { item, uniswapUpdateFavorites } = this.props;
    this.setState(prevState => {
      const localFavorite = !prevState.localFavorite;
      uniswapUpdateFavorites(item.address, localFavorite);
      return { localFavorite };
    });
  };

  render = () => {
    const {
      item,
      showBalance,
      showFavoriteButton,
      uniqueId,
      ...props
    } = this.props;
    const { localFavorite } = this.state;

    return (
      <ButtonPressAnimation
        {...props}
        height={CoinRow.height}
        key={`ExchangeCoinRow-${uniqueId}`}
        onPress={this.handlePress}
        scaleTo={0.96}
      >
        <CoinRow
          {...item}
          bottomRowRender={BottomRow}
          containerStyles={containerStyles}
          showBalance={showBalance}
          topRowRender={TopRow}
        >
          {showFavoriteButton && (
            <CoinRowFavoriteButton
              isFavorited={localFavorite || get(item, 'favorite', false)}
              onPress={this.toggleFavorite}
            />
          )}
        </CoinRow>
      </ButtonPressAnimation>
    );
  };
}

export default connect(null, { uniswapUpdateFavorites })(ExchangeCoinRow);
