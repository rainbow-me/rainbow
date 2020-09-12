import AnimateNumber from '@bankify/react-native-animate-number';
import { get, isEmpty } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutAnimation } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import ExchangeModalTypes from '../../helpers/exchangeModalTypes';
import { useAccountSettings, useGas } from '../../hooks';
import { gweiToWei } from '../../parsers/gas';
import { gasUtils, magicMemo } from '../../utils';
import { getEstimatedTimeForGasPrice } from '../../utils/customGas';
import { Alert } from '../alerts';
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
  height: 55;
`;

const Label = styled(Text).attrs({
  opacity: 0.5,
  size: 'smedium',
  weight: 'medium',
})``;

const ButtonLabel = styled(BorderlessButton).attrs({
  color: colors.appleBlue,
  opacity: 1,
  size: 'smedium',
  weight: 'bold',
})``;

const LittleBorderlessButton = ({ onPress, children }) => (
  <ButtonLabel onPress={onPress}>
    <Text color={colors.appleBlue} weight="bold">
      {children}
    </Text>
  </ButtonLabel>
);

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
  const inputRef = useRef(null);
  const {
    customGasPrice,
    customGasPriceFee,
    customGasPriceEstimate,
    gasPrices,
    updateCustomValues,
    isSufficientGas,
    updateGasPriceOption,
    selectedGasPrice,
    selectedGasPriceOption,
    txFees,
  } = useGas();

  const gasPrice = get(selectedGasPrice, 'txFee.native.value.amount');
  const customGasPriceTimeEstimateHandler = useRef(null);

  const [customGasPriceInput, setCustomGasPriceInput] = useState(0);
  const [estimatedTimeValue, setEstimatedTimeValue] = useState(0);
  const [estimatedTimeUnit, setEstimatedTimeUnit] = useState('min');
  const [timeSymbol, setTimeSymbol] = useState('~');
  const [inputFocused, setInputFocused] = useState(false);

  const defaultCustomGasPrice = gasPrices?.fast?.value?.display;
  const defaultCustomGasPriceUsd = get(
    txFees?.fast,
    'txFee.native.value.amount'
  );
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
  }, [selectedGasPrice, selectedGasPriceOption]);

  const calculateCustomPriceEstimatedTime = useCallback(
    async price => {
      try {
        const priceInWei = gweiToWei(price);

        const minGasPrice = gasPrices.slow.value.amount;
        const maxGasPrice = gasPrices.fast.value.amount;

        const value = await getEstimatedTimeForGasPrice(
          priceInWei,
          minGasPrice,
          maxGasPrice
        );
        updateCustomValues(priceInWei, value);
        setEstimatedTimeValue(value);
      } catch (e) {
        setEstimatedTimeValue('Unknown');
        setEstimatedTimeUnit('');
        setTimeSymbol('');
      }
    },
    [gasPrices, updateCustomValues]
  );

  useEffect(() => {
    // Cancel any queued estimation
    customGasPriceTimeEstimateHandler.current &&
      clearTimeout(customGasPriceTimeEstimateHandler.current);
    // Add a new one to the queue
    customGasPriceTimeEstimateHandler.current = setTimeout(() => {
      customGasPriceInput &&
        calculateCustomPriceEstimatedTime(customGasPriceInput);
    }, 1000);
  }, [calculateCustomPriceEstimatedTime, customGasPriceInput]);

  const handleCustomGasChange = useCallback(async price => {
    setCustomGasPriceInput(price);
  }, []);

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
    if (inputFocused) {
      return;
    }
    LayoutAnimation.easeInEaseOut();

    const currentSpeedIndex = gasUtils.GasSpeedOrder.indexOf(
      selectedGasPriceOption
    );
    const nextSpeedIndex =
      (currentSpeedIndex + 1) % gasUtils.GasSpeedOrder.length;

    const nextSpeed = gasUtils.GasSpeedOrder[nextSpeedIndex];
    updateGasPriceOption(nextSpeed);
  }, [inputFocused, selectedGasPriceOption, updateGasPriceOption]);

  const formatAnimatedGasPrice = useCallback(
    animatedPrice => `${nativeCurrencySymbol}${formatGasPrice(animatedPrice)}`,
    [nativeCurrencySymbol]
  );

  const formatAnimatedEstimatedTime = useCallback(() => {
    const actionLabel = getActionLabel(type);
    const time = parseFloat(estimatedTimeValue || 0).toFixed(0);
    const gasPriceGwei = get(selectedGasPrice, 'value.display');
    // If it's still loading show `...`
    if (
      time === '0' &&
      estimatedTimeUnit === 'min' &&
      selectedGasPriceOption !== gasUtils.CUSTOM
    ) {
      return `${actionLabel} ...`;
    }

    if (selectedGasPriceOption === gasUtils.CUSTOM) {
      if (!customGasPriceFee) {
        return `${formatAnimatedGasPrice(
          defaultCustomGasPriceUsd
        )} ~ ${defaultCustomGasConfirmationTime}`;
      } else {
        return `${formatAnimatedGasPrice(
          get(customGasPriceFee, 'native.value.amount', null)
        )} ${customGasPriceEstimate}`;
      }
    }
    return `${gasPriceGwei} ${timeSymbol} ${time} ${estimatedTimeUnit}`;
  }, [
    customGasPriceEstimate,
    customGasPriceFee,
    defaultCustomGasConfirmationTime,
    defaultCustomGasPriceUsd,
    estimatedTimeUnit,
    estimatedTimeValue,
    formatAnimatedGasPrice,
    selectedGasPrice,
    selectedGasPriceOption,
    timeSymbol,
    type,
  ]);

  const handleCustomGasFocus = useCallback(() => {
    setInputFocused(true);
    onCustomGasFocus();
  }, [onCustomGasFocus]);

  const handleCustomGasBlur = useCallback(() => {
    setInputFocused(false);
    onCustomGasBlur();
  }, [onCustomGasBlur]);

  const handleInputButtonManager = useCallback(() => {
    const complete = () =>
      inputFocused ? inputRef.current?.blur() : inputRef.current?.focus();
    const priceInWei = gweiToWei(customGasPriceInput);
    const minGasPrice = Number(gasPrices.slow.value.amount);
    const maxGasPrice = Number(gasPrices.fast.value.amount);
    let tooLow = priceInWei < minGasPrice;
    let tooHigh = priceInWei > maxGasPrice * 2.5;
    if (tooLow || tooHigh) {
      Alert({
        buttons: [
          {
            onPress: complete,
            text: 'Yes',
          },
          {
            onPress: () => inputRef.current?.focus(),
            style: 'cancel',
            text: 'No, thanks',
          },
        ],
        message:
          (tooLow
            ? 'The gas price you set is too low and your transaction might get stuck or dropped.'
            : 'We noticed the gas price you set is quite high.') +
          '\n\nDo you want to continue anyway?',
        title: 'Heads up!',
      });
    }
  }, [customGasPriceInput, gasPrices, inputFocused]);

  const renderCustomButtonOrLabel = useCallback(() => {
    return (
      <LittleBorderlessButton onPress={handleInputButtonManager}>
        {inputFocused
          ? 'Done'
          : `${customGasPrice ? 'Edit' : 'Enter'} Gas Price`}
      </LittleBorderlessButton>
    );
  }, [customGasPrice, handleInputButtonManager, inputFocused]);

  return (
    <Container as={ButtonPressAnimation} onPress={handlePress}>
      <Row align="center" justify="space-between">
        {selectedGasPriceOption !== gasUtils.CUSTOM ? (
          <AnimateNumber
            formatter={formatAnimatedGasPrice}
            interval={6}
            renderContent={renderGasPriceText}
            steps={6}
            timing="linear"
            value={price}
          />
        ) : (
          <Row>
            <Input
              color={colors.white}
              keyboardAppearance="dark"
              keyboardType="numeric"
              onBlur={handleCustomGasBlur}
              onChangeText={handleCustomGasChange}
              onFocus={handleCustomGasFocus}
              placeholder={`${defaultCustomGasPrice}`}
              placeholderTextColor={colors.alpha(colors.white, 0.3)}
              ref={inputRef}
              value={customGasPriceInput}
              weight="bold"
            />
            {!!customGasPriceInput && (
              <Text color={colors.white} weight="bold">
                &nbsp; Gwei
              </Text>
            )}
          </Row>
        )}
        <GasSpeedLabelPager
          label={selectedGasPriceOption}
          showPager={!inputFocused}
          theme="dark"
        />
      </Row>
      <Row align="center" justify="space-between">
        {selectedGasPriceOption !== gasUtils.CUSTOM ? (
          <Label color={colors.white}>Network Fee</Label>
        ) : (
          renderCustomButtonOrLabel()
        )}
        <AnimateNumber
          formatter={formatAnimatedEstimatedTime}
          interval={1}
          renderContent={renderEstimatedTimeText}
          steps={6}
          timing="linear"
          value={
            selectedGasPriceOption === gasUtils.CUSTOM && customGasPriceEstimate
              ? { customGasPriceEstimate, customGasPriceFee }
              : { estimatedTimeValue, price: selectedGasPrice?.value?.display }
          }
        />
      </Row>
    </Container>
  );
};

export default magicMemo(GasSpeedButton, 'type');
