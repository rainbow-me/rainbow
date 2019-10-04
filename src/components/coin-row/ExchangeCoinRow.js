import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';
import { uniswapUpdateFavorites } from '../../redux/uniswap';
import { colors, padding } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Centered } from '../layout';
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

  constructor(props) {
    super(props);
    this.state = {
      emojiCount: 0,
      favorite: !!props.item.favorite,
    };
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    const isNewAsset = isNewValueForPath(this.props, nextProps, 'uniqueId');
    const isNewFavorite = isNewValueForPath(this.state, nextState, 'favorite');
    const isNewEmojiCount = isNewValueForPath(
      this.state,
      nextState,
      'emojiCount'
    );

    return isNewAsset || isNewFavorite || isNewEmojiCount;
  };

  starRef = React.createRef();

  handlePress = () => {
    const { item, onPress } = this.props;

    if (onPress) {
      onPress(item);
    }
  };

  handleToggleFavorite = () => {
    const { item } = this.props;
    this.setState(prevState => {
      const favorite = !prevState.favorite;
      this.props.uniswapUpdateFavorites(item.address, favorite);
      return {
        emojiCount: favorite ? prevState.emojiCount + 1 : prevState.emojiCount,
        favorite,
      };
    });
  };

  render = () => {
    const { item, ...props } = this.props;
    const { emojiCount, favorite } = this.state;

    return (
      <ButtonPressAnimation
        {...props}
        height={CoinRow.height}
        onPress={this.handlePress}
        scaleTo={0.96}
      >
        <CoinRow
          {...item}
          containerStyles="padding-right: 0"
          bottomRowRender={BottomRow}
          topRowRender={TopRow}
        >
          {/*
              TODO
              XXX
              Is this View necessary?????
            */}
          <View>
            <ButtonPressAnimation
              onPress={this.handleToggleFavorite}
              exclusive
              scaleTo={0.69}
              tapRef={this.starRef}
            >
              <Centered css={padding(19)}>
                <Icon
                  color={favorite ? colors.orangeMedium : colors.grey}
                  name="star"
                />
              </Centered>
            </ButtonPressAnimation>
            <FloatingEmojis
              count={emojiCount}
              distance={69}
              emoji="star"
              range={[30, 30]}
              size="big"
              top={20}
              zIndex={9999}
            />
          </View>
        </CoinRow>
      </ButtonPressAnimation>
    );
  };
}

export default connect(
  null,
  { uniswapUpdateFavorites }
)(ExchangeCoinRow);
