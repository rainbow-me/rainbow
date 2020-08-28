import AnimateNumber from '@bankify/react-native-animate-number';
import { get, isEmpty } from 'lodash';
import React, { useCallback } from 'react';
import { LayoutAnimation } from 'react-native';
import styled from 'styled-components/primitives';
import ExchangeModalTypes from '../../helpers/exchangeModalTypes';
import { useAccountSettings, useGas } from '../../hooks';
import { gasUtils, magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Column, Row } from '../layout';
import { Text } from '../text';
import GasSpeedLabelPager from './GasSpeedLabelPager';
import { colors, padding } from '@rainbow-me/styles';

const Container = styled(Column).attrs({
  hapticType: 'impactHeavy',
  scaleTo: 0.99,
})`
  ${padding(15, 19, 0)};
  width: 100%;
`;

const Label = styled(Text).attrs({
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
    case 'transaction':
      return 'Confirms in';
    default:
      return 'Swaps in';
  }
};

const GasSpeedButton = ({ type }) => {
  const { nativeCurrencySymbol } = useAccountSettings();
  const {
    gasPrices,
    isSufficientGas,
    updateGasPriceOption,
    selectedGasPrice,
    selectedGasPriceOption,
    txFees,
  } = useGas();

  const estimatedTime = get(
    selectedGasPrice,
    'estimatedTime.display',
    ''
  ).split(' ');

  const renderGasPriceText = useCallback(
    animatedNumber => (
      <Text
        color={type === 'transaction' ? colors.black : colors.white}
        letterSpacing="roundedTight"
        size="lmedium"
        weight="semibold"
      >
        {isEmpty(gasPrices) ||
        isEmpty(txFees) ||
        typeof isSufficientGas === 'undefined'
          ? 'Loading...'
          : animatedNumber}
      </Text>
    ),
    [gasPrices, isSufficientGas, txFees, type]
  );

  const renderEstimatedTimeText = useCallback(
    animatedNumber => (
      <Label color={type === 'transaction' ? colors.darkGrey : colors.white}>
        {animatedNumber}
      </Label>
    ),
    [type]
  );

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
      // If it's still loading show `...`
      if (time === '0' && estimatedTimeUnit === 'min') {
        return `${actionLabel} ...`;
      }
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
        <GasSpeedLabelPager
          label={selectedGasPriceOption}
          theme={type === 'transaction' ? 'light' : 'dark'}
        />
      </Row>
      <Row align="center" justify="space-between">
        <Label color={type === 'transaction' ? colors.darkGrey : colors.white}>
          Network Fee
        </Label>
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
