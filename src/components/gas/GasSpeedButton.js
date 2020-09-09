import AnimateNumber from '@bankify/react-native-animate-number';
import { get, isEmpty } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { LayoutAnimation } from 'react-native';
import styled from 'styled-components/primitives';
import ExchangeModalTypes from '../../helpers/exchangeModalTypes';
import { useAccountSettings, useGas } from '../../hooks';
import { ethereumUtils, gasUtils, magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Input } from '../inputs';
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

const GasSpeedButton = ({ onCustomGasBlur, onCustomGasFocus, type }) => {
  const { nativeCurrencySymbol } = useAccountSettings();
  const {
    gasPrices,
    isSufficientGas,
    updateGasPriceOption,
    selectedGasPrice,
    selectedGasPriceOption,
    txFees,
  } = useGas();

  const gasPrice = get(selectedGasPrice, 'txFee.native.value.amount');

  const [customGasCalculated, setCustomGasCalculated] = useState(false);
  const [estimatedTimeValue, setEstimatedTimeValue] = useState(0);
  const [estimatedTimeUnit, setEstimatedTimeUnit] = useState('min');
  const [timeSymbol, setTimeSymbol] = useState('~');
  const [customGasPrice, setCustomGasPrice] = useState(null);
  const [unsafePrice, setUnsafePrice] = useState(false);

  const defaultCustomGasPrice = gasPrices?.fast?.value?.display;
  const defaultCustomGasConfirmationTime =
    gasPrices?.fast?.estimatedTime?.display;

  const price = isNaN(gasPrice) ? '0.00' : gasPrice;

  useEffect(() => {
    const estimatedTime = get(
      selectedGasPrice,
      'estimatedTime.display',
      ''
    ).split(' ');
    setEstimatedTimeValue(estimatedTime[0] || 0);
    setEstimatedTimeUnit(estimatedTime[1] || 'min');
  }, [selectedGasPrice]);

  useEffect(() => {
    setCustomGasCalculated(false);
  }, [selectedGasPriceOption]);

  const handleCustomGasChange = useCallback(
    async price => {
      console.log('setting price');
      setCustomGasPrice(price);
      const slowPriceGwei = gasPrices.slow.value.display.replace(' Gwei', '');
      if (Number(price) < Number(slowPriceGwei)) {
        console.log('too low', 'what should we do?');
        return;
      } else {
        console.log('calculating for price', price);
        try {
          const {
            symbol,
            unit,
            unsafe,
            value,
          } = await ethereumUtils.getEstimatedTimeForGasPrice(Number(price));
          console.log('setting estimate', value, unit, symbol);
          setEstimatedTimeValue(value);
          setEstimatedTimeUnit(unit);
          setTimeSymbol(symbol);
          setCustomGasCalculated(true);
          setUnsafePrice(unsafe);
        } catch (e) {
          setEstimatedTimeValue('Unknown');
          setEstimatedTimeUnit('');
          setTimeSymbol('');
        }
      }
    },
    [gasPrices]
  );

  const renderGasPriceText = useCallback(
    animatedNumber => (
      <Text
        color={colors.white}
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
    [gasPrices, isSufficientGas, txFees]
  );

  const renderEstimatedTimeText = useCallback(
    animatedNumber => <Label color={colors.white}>{animatedNumber}</Label>,
    []
  );

  const handlePress = useCallback(() => {
    onCustomGasBlur();
    LayoutAnimation.easeInEaseOut();

    const currentSpeedIndex = gasUtils.GasSpeedOrder.indexOf(
      selectedGasPriceOption
    );
    const nextSpeedIndex =
      (currentSpeedIndex + 1) % gasUtils.GasSpeedOrder.length;

    const nextSpeed = gasUtils.GasSpeedOrder[nextSpeedIndex];

    updateGasPriceOption(nextSpeed);
  }, [onCustomGasBlur, selectedGasPriceOption, updateGasPriceOption]);

  const formatAnimatedGasPrice = useCallback(
    animatedPrice => `${nativeCurrencySymbol}${formatGasPrice(animatedPrice)}`,
    [nativeCurrencySymbol]
  );

  const formatAnimatedEstimatedTime = useCallback(
    estimatedTime => {
      console.log('custom', selectedGasPriceOption, customGasCalculated);
      const actionLabel = getActionLabel(type);
      const time = parseFloat(estimatedTime || 0).toFixed(0);

      // If it's still loading show `...`
      if (
        time === '0' &&
        estimatedTimeUnit === 'min' &&
        selectedGasPriceOption !== gasUtils.CUSTOM
      ) {
        return `${actionLabel} ...`;
      }
      if (selectedGasPriceOption === gasUtils.CUSTOM && !customGasCalculated) {
        return `${actionLabel} ~ ${defaultCustomGasConfirmationTime}`;
      }

      return `${actionLabel} ${timeSymbol} ${time} ${estimatedTimeUnit}`;
    },
    [
      customGasCalculated,
      defaultCustomGasConfirmationTime,
      estimatedTimeUnit,
      selectedGasPriceOption,
      timeSymbol,
      type,
    ]
  );

  return (
    <Container as={ButtonPressAnimation} onPress={handlePress}>
      <Row align="center" justify="space-between">
        {price !== '0.00' ? (
          <AnimateNumber
            formatter={formatAnimatedGasPrice}
            interval={6}
            renderContent={renderGasPriceText}
            steps={6}
            timing="linear"
            value={price}
          />
        ) : (
          <Input
            color={colors.white}
            keyboardAppearance="dark"
            keyboardType="numeric"
            onBlur={onCustomGasBlur}
            onChangeText={handleCustomGasChange}
            onFocus={onCustomGasFocus}
            placeholder={defaultCustomGasPrice}
            placeholderTextColor={colors.alpha(colors.white, 0.3)}
            value={customGasPrice}
            weight="bold"
          />
        )}

        <GasSpeedLabelPager label={selectedGasPriceOption} theme="dark" />
      </Row>
      <Row align="center" justify="space-between">
        {selectedGasPriceOption !== gasUtils.CUSTOM ? (
          <Label color={colors.white}>Network Fee</Label>
        ) : unsafePrice ? (
          <Label color={colors.red}>Gas too low!</Label>
        ) : (
          <Label color={colors.white}>Enter a gas price</Label>
        )}

        <AnimateNumber
          formatter={formatAnimatedEstimatedTime}
          interval={1}
          renderContent={renderEstimatedTimeText}
          steps={6}
          symbol={timeSymbol}
          timing="linear"
          value={estimatedTimeValue}
        />
      </Row>
    </Container>
  );
};

export default magicMemo(GasSpeedButton, 'type');
