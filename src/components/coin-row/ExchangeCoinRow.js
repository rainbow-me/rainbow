import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { View } from 'react-native';
import { withNeverRerender } from '../../hoc';
import { colors, padding } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Monospace } from '../text';
import CoinName from './CoinName';
import CoinRow from './CoinRow';

const BottomRow = ({ balance, symbol }) => (
  <Monospace
    color={colors.alpha(colors.blueGreyDark, 0.6)}
    size="smedium"
  >
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

export default class ExchangeCoinRow extends Component {
  static propTypes = {
    favorite: PropTypes.bool,
    index: PropTypes.number,
    item: PropTypes.shape({ symbol: PropTypes.string }),
    onPress: PropTypes.func,
    uniqueId: PropTypes.string,
  }

  starRef = React.createRef()

  state = {
    emojiCount: 0,
    favorite: false,
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    const isNewAsset = isNewValueForPath(this.props, nextProps, 'uniqueId');
    const isNewFavorite = isNewValueForPath(this.state, nextState, 'favorite');
    const isNewEmojiCount = isNewValueForPath(this.state, nextState, 'emojiCount');

    return (
      isNewAsset
      || isNewFavorite
      || isNewEmojiCount
    );
  }

  handlePress = () => {
    const { item, onPress } = this.props;

    if (onPress) {
      onPress(item);
    }
  }

  handleToggleFavorite = () => {
    this.setState(prevState => {
      const favorite = !prevState.favorite;
      return {
        emojiCount: favorite ? prevState.emojiCount + 1 : prevState.emojiCount,
        favorite,
      };
    });
  }

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
          containerStyles={'padding-right: 0'}
          bottomRowRender={BottomRow}
          topRowRender={TopRow}
        >
          {
            /*
              TODO
              XXX
              Is this View necessary?????
            */
          }
          <View>
            <ButtonPressAnimation
              onPress={this.handleToggleFavorite}
              exclusive={true}
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
  }
}
