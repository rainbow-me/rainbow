import AnimateNumber from '@bankify/react-native-animate-number';
import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { LayoutAnimation } from 'react-native';
import { compose, mapProps, onlyUpdateForKeys, withProps } from 'recompact';
import { withAccountSettings, withGas } from '../../hoc';
import { colors, padding } from '../../styles';
import { gasUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Column, Row } from '../layout';
import { Text } from '../text';
import GasSpeedLabelPager from './GasSpeedLabelPager';

const Label = withProps({
  color: colors.alpha(colors.white, 0.4),
  size: 'smedium',
  weight: 'medium',
})(Text);

const renderEstimatedTimeText = animatedNumber => (
  <Label>{animatedNumber}</Label>
);

const renderGasPriceText = animatedNumber => (
  <Text color="white" letterSpacing="tight" size="lmedium" weight="semibold">
    {animatedNumber}
  </Text>
);

class GasSpeedButton extends PureComponent {
  static propTypes = {
    estimatedTimeUnit: PropTypes.string,
    estimatedTimeValue: PropTypes.string,
    gasPrices: PropTypes.object,
    gasUpdateGasPriceOption: PropTypes.func,
    nativeCurrencySymbol: PropTypes.string,
    price: PropTypes.string,
    selectedGasPriceOption: PropTypes.oneOf(gasUtils.GasSpeedOrder),
  };

  handlePress = () => {
    const {
      gasPrices,
      gasUpdateGasPriceOption,
      selectedGasPriceOption,
    } = this.props;

    LayoutAnimation.easeInEaseOut();

    const currentSpeedIndex = gasUtils.GasSpeedOrder.indexOf(
      selectedGasPriceOption
    );
    const nextSpeedIndex =
      (currentSpeedIndex + 1) % gasUtils.GasSpeedOrder.length;

    const nextSpeed = gasUtils.GasSpeedOrder[nextSpeedIndex];
    const nextSpeedGweiValue = get(gasPrices, `[${nextSpeed}].value.display`);

    gasUpdateGasPriceOption(nextSpeed);
    analytics.track('Updated Gas Price', { gasPrice: nextSpeedGweiValue });
  };

  formatAnimatedGasPrice = animatedPrice => {
    const formattedPrice = parseFloat(animatedPrice).toFixed(3);
    return `${this.props.nativeCurrencySymbol}${formattedPrice}`;
  };

  formatAnimatedEstimatedTime = estimatedTime => {
    const time = parseFloat(estimatedTime || 0).toFixed(0);
    return `Swaps in ~ ${time} ${this.props.estimatedTimeUnit}`;
  };

  render = () => (
    <ButtonPressAnimation
      hapticType="impactHeavy"
      onPress={this.handlePress}
      scaleTo={0.99999}
      width="100%"
    >
      <Column css={padding(14, 19, 0)} width="100%">
        <Row align="center" justify="space-between">
          <AnimateNumber
            formatter={this.formatAnimatedGasPrice}
            interval={6}
            renderContent={renderGasPriceText}
            steps={6}
            timing="linear"
            value={this.props.price}
          />
          <GasSpeedLabelPager label={this.props.selectedGasPriceOption} />
        </Row>
        <Row align="center" justify="space-between">
          <Label>Fee</Label>
          <AnimateNumber
            formatter={this.formatAnimatedEstimatedTime}
            interval={1}
            renderContent={renderEstimatedTimeText}
            steps={6}
            timing="linear"
            value={this.props.estimatedTimeValue}
          />
        </Row>
      </Column>
    </ButtonPressAnimation>
  );
}

export default compose(
  withAccountSettings,
  withGas,
  mapProps(({ selectedGasPrice, ...props }) => {
    const estimatedTime = get(
      selectedGasPrice,
      'estimatedTime.display',
      ''
    ).split(' ');

    const gasPrice = get(selectedGasPrice, 'txFee.native.value.amount');

    return {
      estimatedTimeUnit: estimatedTime[1] || 'min',
      estimatedTimeValue: estimatedTime[0] || 0,
      price: isNaN(gasPrice) ? '0.00' : gasPrice,
      ...props,
    };
  }),
  onlyUpdateForKeys([
    'estimatedTimeUnit',
    'estimatedTimeValue',
    'price',
    'selectedGasPriceOption',
  ])
)(GasSpeedButton);
