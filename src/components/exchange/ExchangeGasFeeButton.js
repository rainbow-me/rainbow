import AnimateNumber from '@bankify/react-native-animate-number';
import { get, upperFirst } from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  compose,
  mapProps,
  withProps,
} from 'recompact';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Nbsp } from '../html-entities';
import { Column, Row } from '../layout';
import { Emoji, Text } from '../text';

const EmojiForGasSpeedType = {
  fast: 'rocket', // 🚀️
  normal: 'stopwatch', // ⏱️
  slow: 'snail', // 🐌️
};

const Label = withProps({
  color: colors.alpha(colors.white, 0.4),
  size: 'smedium',
  weight: 'medium',
})(Text);

const Title = withProps({
  color: colors.white,
  letterSpacing: 'tight',
  size: 'lmedium',
  weight: 'semibold',
})(Text);

const renderGasPriceText = (displayValue) => (
  <Title color="white" size="smedium" weight="semibold">
    {displayValue}
  </Title>
);

class ExchangeGasFeeButton extends PureComponent {
  static propTypes = {
    estimatedTime: PropTypes.string,
    label: PropTypes.string,
    nativeCurrencySymbol: PropTypes.string,
    onPress: PropTypes.func,
    price: PropTypes.string,
  }

  handlePress = (event) => {
    if (this.props.onPress) {
      this.props.onPress(event);
    }
  }

  formatAnimatedGasPrice = (gasPrice) => {
    const price = parseFloat(gasPrice || '0.00').toFixed(3);
    return `${this.props.nativeCurrencySymbol}${price}`;
  }

  render = () => {
    const {
      estimatedTime,
      label,
      price,
    } = this.props;

    return (
      <ButtonPressAnimation onPress={this.handlePress}>
        <Column css={padding(14, 19, 0)} width="100%">
          <Row align="center" justify="space-between">
            <AnimateNumber
              formatter={this.formatAnimatedGasPrice}
              interval={1}
              renderContent={renderGasPriceText}
              steps={12}
              timing="linear"
              value={price}
            />
            <Row align="center" justify="end" height={26}>
              <Emoji
                letterSpacing="tight"
                name={EmojiForGasSpeedType[label] || EmojiForGasSpeedType.normal}
                size="lmedium"
              />
              <Nbsp />
              <Title>{upperFirst(label)}</Title>
            </Row>
          </Row>
          <Row align="center" justify="space-between">
            <Label>Fee</Label>
            <Row align="center" justify="end">
              <Label>Swaps in ~</Label>
              <Label><Nbsp />{estimatedTime}</Label>
            </Row>
          </Row>
        </Column>
      </ButtonPressAnimation>
    );
  }
}

export default compose(
  mapProps(({ gasPrice, ...props }) => {
    let label = get(gasPrice, 'option', 'normal');
    if (label === 'average') {
      label = 'normal';
    }

    return {
      estimatedTime: get(gasPrice, 'estimatedTime.display', ''),
      label,
      price: get(gasPrice, 'txFee.native.value.amount', '0.00'),
      ...props,
    };
  }),
)(ExchangeGasFeeButton);
