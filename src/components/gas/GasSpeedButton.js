import AnimateNumber from '@bankify/react-native-animate-number';
import { get } from 'lodash';
import React, { useCallback } from 'react';
import { LayoutAnimation } from 'react-native';
import styled from 'styled-components/primitives';
import ExchangeModalTypes from '../../helpers/exchangeModalTypes';
import { useAccountSettings, useGas } from '../../hooks';
import { colors, padding } from '../../styles';
import { gasUtils, magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Column, Row } from '../layout';
import { Text } from '../text';
import GasSpeedLabelPager from './GasSpeedLabelPager';

const Container = styled(Column).attrs({
  hapticType: 'impactHeavy',
  scaleTo: 0.99,
})`
  ${padding(15, 19, 0)};
  width: 100%;
`;

const Label = styled(Text).attrs({
  color: colors.white,
  opacity: 0.5,
  size: 'smedium',
  weight: 'medium',
})``;

const formatGasPrice = gasPrice => {
  const fixedGasPrice = Number(gasPrice).toFixed(3);
  const gasPriceWithTrailingZerosStripped = parseFloat(fixedGasPrice);
  return gasPriceWithTrailingZerosStripped;
};

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

const GasSpeedButton = ({ type }) => {
  const { nativeCurrencySymbol } = useAccountSettings();
  const {
    updateGasPriceOption,
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

    updateGasPriceOption(nextSpeed);
  }, [selectedGasPriceOption, updateGasPriceOption]);

  const formatAnimatedGasPrice = useCallback(
    animatedPrice => `${nativeCurrencySymbol}${formatGasPrice(animatedPrice)}`,
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
    <Container as={ButtonPressAnimation} onPress={handlePress}>
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
    </Container>
  );
};

export default magicMemo(GasSpeedButton, 'type');
