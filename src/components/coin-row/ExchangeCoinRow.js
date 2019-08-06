import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
// import { NavigationEvents, withNavigationFocus } from 'react-navigation';
// import styled from 'styled-components/primitives';
import { withProps } from 'recompact';
import Animated from 'react-native-reanimated';
import { borders, colors, position } from '../../styles';
import { isNewValueForPath } from '../../utils';isNewValueForPath
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Column, FlexItem, Row } from '../layout';
import { Monospace } from '../text';
import SendCoinRow from './SendCoinRow';
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

  shouldComponentUpdate = (nextProps) => {
    const should = (
      isNewValueForPath(this.props, nextProps, 'item.uniqueId')
      || isNewValueForPath(this.props, nextProps, 'favorite')
    );

    // console.log('ExchangeCoinRow shouldComponentUpdate', should);

    return true;
  }

  handleToggleFavorite = () => {
    console.log('favorite');
  }

  handlePress = () => {
    const { item: { symbol }, onPress } = this.props;

    if (onPress) {
      onPress(symbol);
    }
  }

  render = () => {
    const { favorite, item } = this.props;

    console.log('item', item);

    return (
      <ButtonPressAnimation
        onPress={this.handlePress}
        scaleTo={0.96}
      >
        <CoinRow
          {...item}
          bottomRowRender={BottomRow}
          topRowRender={TopRow}
        >
          <ButtonPressAnimation
            onPress={this.handleToggleFavorite}
            exclusive={true}
            scaleTo={0.6}
            tapRef={this.starRef}
          >
            <Centered
              {...position.sizeAsObject(50)}
              backgroundColor={colors.skeleton}
              zIndex={9999}
            >
              <Icon
                color={favorite ? colors.orangeLight : colors.grey}
                name="star"
              />
            </Centered>
          </ButtonPressAnimation>
        </CoinRow>
      </ButtonPressAnimation>
    );
  }
}
