import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { View } from 'react-native';
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

export default class ExchangeCoinRow extends PureComponent {
  static propTypes = {
    favorite: PropTypes.bool,
    index: PropTypes.number,
    item: PropTypes.shape({ symbol: PropTypes.string }),
    onPress: PropTypes.func,
  }

  starRef = React.createRef()

  state = {
    emojiCount: 0,
    favorite: false,
  }

  shouldComponentUpdate = (nextProps, nextState) => (
    isNewValueForPath(this.props, nextProps, 'item.uniqueId')
    || isNewValueForPath(this.state, nextState, 'favorite')
    || isNewValueForPath(this.state, nextState, 'emojiCount')
  )

  handlePress = () => {
    const { item: { symbol }, onPress } = this.props;

    if (onPress) {
      onPress(symbol);
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
        onPress={this.handlePress}
        scaleTo={0.96}
      >
        <CoinRow
          {...item}
          containerStyles={'padding-right: 0'}
          bottomRowRender={BottomRow}
          topRowRender={TopRow}
        >
          {/*
          TODO
          XXX

           Is this View necessary?????*/}
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
