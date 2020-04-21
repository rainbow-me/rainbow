import AnimateNumber from '@bankify/react-native-animate-number';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { LayoutAnimation } from 'react-native';
import { useDispatch } from 'react-redux';
import { withProps } from 'recompact';
import ExchangeModalTypes from '../../helpers/exchangeModalTypes';
import { useAccountSettings, useGas } from '../../hooks';
import { colors, padding } from '../../styles';
import { gasUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Column, Row } from '../layout';
import { Text } from '../text';
import GasSpeedLabelPager from './GasSpeedLabelPager';

const Label = withProps({
  color: colors.alpha(colors.white, 0.5),
  size: 'smedium',
  weight: 'medium',
})(Text);

const renderEstimatedTimeText = animatedNumber => (
  <Label>{animatedNumber}</Label>
);

const renderGasPriceText = animatedNumber => (
  <Text
    color="white"
    letterSpacing="roundedTight"
    size="lmedium"
    weight="semibold"
  >
    {animatedNumber}
  </Text>
);

const getActionLabel = type => {
  switch (type) {
    case ExchangeModalTypes.deposit:
      return 'Deposits in';
    case ExchangeModalTypes.withdrawal:
      return 'Withdraws in';
    default:
      return 'Swaps in';
  }
};

const GasSpeedButton = ({ type }) => {
  const dispatch = useDispatch();
  const { nativeCurrencySymbol } = useAccountSettings();
  const {
    gasUpdateGasPriceOption,
    selectedGasPrice,
    selectedGasPriceOption,
  } = useGas();

  const estimatedTime = get(
    selectedGasPrice,
    'estimatedTime.display',
    ''
  ).split(' ');

  const gasPrice = get(selectedGasPrice, 'txFee.native.value.amount');
  const estimatedTimeUnit = estimatedTime[1] || 'min';
  const estimatedTimeValue = estimatedTime[0] || 0;
  const price = isNaN(gasPrice) ? '0.00' : gasPrice;

  const handlePress = useCallback(() => {
    LayoutAnimation.easeInEaseOut();

    const currentSpeedIndex = gasUtils.GasSpeedOrder.indexOf(
      selectedGasPriceOption
    );
    const nextSpeedIndex =
      (currentSpeedIndex + 1) % gasUtils.GasSpeedOrder.length;

    const nextSpeed = gasUtils.GasSpeedOrder[nextSpeedIndex];

    dispatch(gasUpdateGasPriceOption(nextSpeed));
  }, [dispatch, gasUpdateGasPriceOption, selectedGasPriceOption]);

  const formatAnimatedGasPrice = useCallback(
    animatedPrice => {
      const formattedPrice = parseFloat(animatedPrice).toFixed(3);
      return `${nativeCurrencySymbol}${formattedPrice}`;
    },
    [nativeCurrencySymbol]
  );

  const formatAnimatedEstimatedTime = useCallback(
    estimatedTime => {
      const actionLabel = getActionLabel(type);
      const time = parseFloat(estimatedTime || 0).toFixed(0);
      return `${actionLabel} ~ ${time} ${estimatedTimeUnit}`;
    },
    [estimatedTimeUnit, type]
  );

  return (
    <ButtonPressAnimation
      hapticType="impactHeavy"
      onPress={handlePress}
      scaleTo={0.99}
      width="100%"
    >
      <Column css={padding(15, 19, 0)} width="100%">
        <Row align="center" justify="space-between">
          <AnimateNumber
            formatter={formatAnimatedGasPrice}
            interval={6}
            renderContent={renderGasPriceText}
            steps={6}
            timing="linear"
            value={price}
          />
          <GasSpeedLabelPager label={selectedGasPriceOption} />
        </Row>
        <Row align="center" justify="space-between">
          <Label>Fee</Label>
          <AnimateNumber
            formatter={formatAnimatedEstimatedTime}
            interval={1}
            renderContent={renderEstimatedTimeText}
            steps={6}
            timing="linear"
            value={estimatedTimeValue}
          />
        </Row>
      </Column>
    </ButtonPressAnimation>
  );
};

GasSpeedButton.propTypes = {
  type: PropTypes.oneOf(Object.values(ExchangeModalTypes)),
};

export default GasSpeedButton;
