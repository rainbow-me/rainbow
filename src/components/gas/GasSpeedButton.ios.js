import AnimateNumber from '@bankify/react-native-animate-number';
import { get, isEmpty } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LayoutAnimation } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import styled from 'styled-components/primitives';
import ExchangeModalTypes from '../../helpers/exchangeModalTypes';
import { useAccountSettings, useGas } from '../../hooks';
import { gweiToWei, weiToGwei } from '../../parsers/gas';
import { gasUtils, magicMemo } from '../../utils';
import { Alert } from '../alerts';
import { ButtonPressAnimation } from '../animations';
import { Input } from '../inputs';
import { Column, Row } from '../layout';
import { Text } from '../text';
import GasSpeedLabelPager from './GasSpeedLabelPager';
import { colors, padding } from '@rainbow-me/styles';

const { GasSpeedOrder, CUSTOM, FAST, SLOW } = gasUtils;

const Container = styled(Column).attrs({
  hapticType: 'impactHeavy',
  scaleTo: 1.0666,
})`
  ${padding(15, 19, 0)};
  height: 76;
  width: 100%;
`;

const Label = styled(Text).attrs({
  size: 'smedium',
  weight: 'semibold',
})``;

const ButtonLabel = styled(BorderlessButton).attrs({
  color: colors.appleBlue,
  hitSlop: 40,
  opacity: 1,
  size: 'smedium',
  weight: 'bold',
})`
  padding-bottom: 10;
`;

const LittleBorderlessButton = ({ onPress, children, testID }) => (
  <ButtonLabel onPress={onPress} testID={testID} width={120}>
    <Text color={colors.appleBlue} size="smedium" weight="bold">
      {children}
    </Text>
  </ButtonLabel>
);

const BottomRightLabel = ({ formatter, theme }) => (
  <Label
    align="right"
    color={
      theme === 'dark'
        ? colors.alpha(colors.darkModeColors.blueGreyDark, 0.6)
        : colors.alpha(colors.blueGreyDark, 0.6)
    }
  >
    {formatter()}
  </Label>
);

const formatGasPrice = (gasPrice, nativeCurrency) => {
  return nativeCurrency === 'ETH'
    ? (Math.ceil(Number(gasPrice) * 10000) / 10000).toFixed(4)
    : (Math.ceil(Number(gasPrice) * 100) / 100).toFixed(2);
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

const GasSpeedButton = ({
  dontBlur,
  onCustomGasBlur,
  onCustomGasFocus,
  testID,
  type,
  theme = 'dark',
  options = null,
  minGasPrice = null,
}) => {
  const inputRef = useRef(null);
  const { nativeCurrencySymbol, nativeCurrency } = useAccountSettings();
  const {
    gasPrices,
    updateCustomValues,
    isSufficientGas,
    updateGasPriceOption,
    selectedGasPrice,
    selectedGasPriceOption,
    txFees,
  } = useGas();

  const gasPricesAvailable = useMemo(() => {
    if (!options || !minGasPrice) {
      return gasPrices;
    }

    const filteredGasPrices = {};
    options.forEach(speed => {
      filteredGasPrices[speed] = gasPrices[speed];
    });
    return filteredGasPrices;
  }, [gasPrices, minGasPrice, options]);

  const gasPrice = get(selectedGasPrice, 'txFee.native.value.amount');
  const customGasPriceTimeEstimateHandler = useRef(null);

  const [customGasPriceInput, setCustomGasPriceInput] = useState(0);
  const [estimatedTimeValue, setEstimatedTimeValue] = useState(0);
  const [estimatedTimeUnit, setEstimatedTimeUnit] = useState('min');
  const [inputFocused, setInputFocused] = useState(false);

  const defaultCustomGasPrice = Math.round(
    weiToGwei(gasPricesAvailable?.fast?.value?.amount)
  );
  const defaultCustomGasPriceUsd = get(
    txFees?.fast,
    'txFee.native.value.amount'
  );
  const defaultCustomGasConfirmationTime =
    gasPricesAvailable?.fast?.estimatedTime?.display;

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
        await updateCustomValues(price);
        updateGasPriceOption(CUSTOM);
      } catch (e) {
        setEstimatedTimeValue(0);
        setEstimatedTimeUnit('min');
      }
    },
    [updateCustomValues, updateGasPriceOption]
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
        color={
          theme === 'dark'
            ? colors.white
            : colors.alpha(colors.blueGreyDark, 0.8)
        }
        letterSpacing="roundedTight"
        size="lmedium"
        weight="bold"
      >
        {isEmpty(gasPricesAvailable) ||
        isEmpty(txFees) ||
        typeof isSufficientGas === 'undefined'
          ? 'Loading...'
          : animatedNumber}
      </Text>
    ),
    [gasPricesAvailable, isSufficientGas, theme, txFees]
  );

  const handlePress = useCallback(() => {
    if (inputFocused) {
      return;
    }
    LayoutAnimation.easeInEaseOut();
    const gasOptions = options || GasSpeedOrder;
    const currentSpeedIndex = gasOptions.indexOf(selectedGasPriceOption);
    const nextSpeedIndex = (currentSpeedIndex + 1) % gasOptions.length;

    const nextSpeed = gasOptions[nextSpeedIndex];
    updateGasPriceOption(nextSpeed);
  }, [inputFocused, options, selectedGasPriceOption, updateGasPriceOption]);

  const formatAnimatedGasPrice = useCallback(
    animatedPrice =>
      `${nativeCurrencySymbol}${formatGasPrice(animatedPrice, nativeCurrency)}`,
    [nativeCurrencySymbol, nativeCurrency]
  );

  const formatBottomRightLabel = useCallback(() => {
    const actionLabel = getActionLabel(type);
    const time = parseFloat(estimatedTimeValue || 0).toFixed(0);
    const gasPriceGwei = get(selectedGasPrice, 'value.display');
    let timeSymbol = '~';

    if (selectedGasPriceOption === CUSTOM) {
      if (!customGasPriceInput) {
        return `${formatAnimatedGasPrice(
          defaultCustomGasPriceUsd
        )} ~ ${defaultCustomGasConfirmationTime}`;
      } else if (gasPricesAvailable[CUSTOM]?.value) {
        const priceInWei = Number(gasPricesAvailable[CUSTOM].value.amount);
        const minGasPriceSlow = gasPricesAvailable[SLOW]
          ? Number(gasPricesAvailable[SLOW].value.amount)
          : Number(gasPricesAvailable[FAST].value.amount);
        const maxGasPriceFast = Number(gasPricesAvailable[FAST].value.amount);
        if (priceInWei < minGasPriceSlow) {
          timeSymbol = '>';
        } else if (priceInWei > maxGasPriceFast) {
          timeSymbol = '<';
        }

        return `${formatAnimatedGasPrice(
          gasPrice
        )} ${timeSymbol} ${time} ${estimatedTimeUnit}`;
      } else {
        return `${actionLabel} ...`;
      }
    }

    // If it's still loading show `...`
    if (time === '0' && estimatedTimeUnit === 'min') {
      return `${actionLabel} ...`;
    }

    return `${gasPriceGwei} ${timeSymbol} ${time} ${estimatedTimeUnit}`;
  }, [
    customGasPriceInput,
    defaultCustomGasConfirmationTime,
    defaultCustomGasPriceUsd,
    estimatedTimeUnit,
    estimatedTimeValue,
    formatAnimatedGasPrice,
    gasPrice,
    gasPricesAvailable,
    selectedGasPrice,
    selectedGasPriceOption,
    type,
  ]);

  const handleCustomGasFocus = useCallback(() => {
    setInputFocused(true);
    onCustomGasFocus?.();
  }, [onCustomGasFocus]);

  const handleCustomGasBlur = useCallback(() => {
    setInputFocused(false);
    onCustomGasBlur?.();
  }, [onCustomGasBlur]);

  const handleInputButtonManager = useCallback(() => {
    const complete = () => {
      if (inputFocused) {
        if (dontBlur) {
          handleCustomGasBlur();
        } else {
          inputRef.current?.blur();
        }
      } else {
        inputRef.current?.focus();
      }
    };

    if (customGasPriceInput === '0') {
      Alert({
        buttons: [
          {
            onPress: () => inputRef.current?.focus(),
            text: 'OK',
          },
        ],
        message: 'You need to enter a valid amount',
        title: 'Invalid Gas Price',
      });
      return;
    }

    if (!customGasPriceInput || !inputFocused) {
      complete();
      ReactNativeHapticFeedback.trigger('impactMedium');
      return;
    }

    if (minGasPrice && Number(customGasPriceInput) < minGasPrice) {
      Alert({
        buttons: [
          {
            onPress: () => inputRef.current?.focus(),
            text: 'OK',
          },
        ],
        message: `The minimum gas price valid allowed is ${minGasPrice} GWEI`,
        title: 'Gas Price Too Low',
      });
      return;
    }

    const priceInWei = gweiToWei(customGasPriceInput);
    const minGasPriceSlow = Number(
      gasPricesAvailable?.slow?.value?.amount || 0
    );
    const maxGasPriceFast = Number(
      gasPricesAvailable?.fast?.value?.amount || 0
    );
    let tooLow = priceInWei < minGasPriceSlow;
    let tooHigh = priceInWei > maxGasPriceFast * 2.5;

    if (tooLow || tooHigh) {
      Alert({
        buttons: [
          {
            onPress: complete,
            text: 'Proceed Anyway',
          },
          {
            onPress: () => inputRef.current?.focus(),
            style: 'cancel',
            text: 'Edit Gas Price',
          },
        ],
        message: tooLow
          ? 'Setting a higher gas price is recommended to avoid issues.'
          : 'Double check that you entered the correct amount—you’re likely paying more than you need to!',
        title: tooLow
          ? 'Low gas price–transaction might get stuck!'
          : 'High gas price!',
      });
    } else {
      complete();
    }
  }, [
    customGasPriceInput,
    inputFocused,
    minGasPrice,
    gasPricesAvailable?.slow?.value?.amount,
    gasPricesAvailable?.fast?.value?.amount,
    dontBlur,
    handleCustomGasBlur,
  ]);

  const focusOnInput = useCallback(() => inputRef.current?.focus(), []);
  const isCustom = selectedGasPriceOption === CUSTOM ? true : false;

  return (
    <Container as={ButtonPressAnimation} onPress={handlePress} testID={testID}>
      <Row align="end" justify="space-between" marginBottom={1.5}>
        {!isCustom ? (
          <AnimateNumber
            formatter={formatAnimatedGasPrice}
            interval={6}
            renderContent={renderGasPriceText}
            steps={6}
            timing="linear"
            value={price}
          />
        ) : (
          <BorderlessButton onPress={focusOnInput}>
            <Row>
              <Input
                color={
                  theme === 'dark'
                    ? colors.white
                    : colors.alpha(colors.blueGreyDark, 0.8)
                }
                height={19}
                keyboardAppearance="dark"
                keyboardType="numeric"
                letterSpacing="roundedMedium"
                maxLength={5}
                onBlur={handleCustomGasBlur}
                onChangeText={handleCustomGasChange}
                onFocus={handleCustomGasFocus}
                onSubmitEditing={handleInputButtonManager}
                placeholder={`${defaultCustomGasPrice}`}
                placeholderTextColor={
                  theme === 'dark'
                    ? colors.alpha(colors.darkModeColors.blueGreyDark, 0.3)
                    : colors.alpha(colors.blueGreyDark, 0.3)
                }
                ref={inputRef}
                size="lmedium"
                testID="custom-gas-input"
                value={customGasPriceInput}
                weight="bold"
              />
              <Text
                color={
                  customGasPriceInput
                    ? theme === 'dark'
                      ? colors.white
                      : colors.alpha(colors.blueGreyDark, 0.8)
                    : theme === 'dark'
                    ? colors.alpha(colors.darkModeColors.blueGreyDark, 0.3)
                    : colors.alpha(colors.blueGreyDark, 0.3)
                }
                size="lmedium"
                weight="bold"
              >
                {' '}
                Gwei
              </Text>
            </Row>
          </BorderlessButton>
        )}

        <GasSpeedLabelPager
          label={selectedGasPriceOption}
          options={options}
          showPager={!inputFocused}
          theme={theme}
        />
      </Row>
      <Row justify="space-between">
        {!isCustom ? (
          <Label
            color={
              theme === 'dark'
                ? colors.alpha(colors.darkModeColors.blueGreyDark, 0.6)
                : colors.alpha(colors.blueGreyDark, 0.6)
            }
          >
            Network Fee
          </Label>
        ) : (
          <LittleBorderlessButton
            onPress={handleInputButtonManager}
            testID="custom-gas-edit-button"
          >
            {inputFocused
              ? 'Done'
              : `${customGasPriceInput ? 'Edit' : 'Enter'} Gas Price`}
          </LittleBorderlessButton>
        )}

        <BottomRightLabel
          formatter={formatBottomRightLabel}
          theme={theme}
          value={{
            estimatedTimeValue,
            price: selectedGasPrice?.value?.display,
          }}
        />
      </Row>
    </Container>
  );
};

export default magicMemo(GasSpeedButton, 'type');
