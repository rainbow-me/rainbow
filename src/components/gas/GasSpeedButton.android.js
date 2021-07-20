import { get, isEmpty, isNil } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Keyboard, LayoutAnimation, View } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import styled from 'styled-components';
import { Alert } from '../alerts';
import {
  ButtonPressAnimation,
  ScaleButtonZoomableAndroid,
} from '../animations';
import { Input } from '../inputs';
import { Column, Row } from '../layout';
import { AnimatedNumber, Text } from '../text';
import GasSpeedLabelPager from './GasSpeedLabelPager';
import { isL2Network } from '@rainbow-me/handlers/web3';
import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';
import { useAccountSettings, useGas } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { gweiToWei, weiToGwei } from '@rainbow-me/parsers';
import Routes from '@rainbow-me/routes';
import { fonts, fontWithWidth, margin, padding } from '@rainbow-me/styles';
import { darkModeThemeColors } from '@rainbow-me/styles/colors';
import { gasUtils, magicMemo } from '@rainbow-me/utils';

const { GasSpeedOrder, CUSTOM, FAST, NORMAL, SLOW } = gasUtils;

const Container = styled(Row).attrs({
  justify: 'space-between',
  opacityTouchable: true,
  pointerEvents: 'auto',
})`
  ${({ horizontalPadding, topPadding }) =>
    padding(topPadding, horizontalPadding, 0)};
  height: 76;
  width: 100%;
`;

const Label = styled(Text).attrs({
  size: 'smedium',
  weight: 'semibold',
})`
  ${fontWithWidth(fonts.weight.semibold)};
`;

const ButtonLabel = styled(BorderlessButton).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
  hitSlop: 40,
  opacity: 1,
  size: 'smedium',
  weight: 'bold',
}))`
  padding-bottom: 10;
`;

const GasInput = styled(Input).attrs(
  ({ gasTheme: theme, theme: { colors } }) => ({
    color:
      theme === 'dark'
        ? colors.whiteLabel
        : colors.alpha(colors.blueGreyDark, 0.8),
    height: 58,
    keyboardAppearance: 'dark',
    keyboardType: 'numeric',
    letterSpacing: 'roundedMedium',
    maxLength: 5,
    multiline: false,
    placeholderTextColor:
      theme === 'dark'
        ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.3)
        : colors.alpha(colors.blueGreyDark, 0.3),
    size: 'lmedium',
    testID: 'custom-gas-input',
  })
)`
  ${fontWithWidth(fonts.weight.bold)};
  ${margin(-13, 0, -15, -4)}
`;

const LittleBorderlessButton = ({ onPress, children, testID }) => {
  const { colors } = useTheme();
  return (
    <ButtonLabel onPress={onPress} testID={testID} width={120}>
      <Text
        {...(android && { lineHeight: 21 })}
        color={colors.appleBlue}
        size="smedium"
        weight="bold"
      >
        {children}
      </Text>
    </ButtonLabel>
  );
};

const BottomRightLabel = ({ formatter, theme }) => {
  const { colors } = useTheme();
  return (
    <Label
      align="right"
      color={
        theme === 'dark'
          ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.6)
          : colors.alpha(colors.blueGreyDark, 0.6)
      }
      style={{ marginTop: -2 }}
    >
      {formatter()}
    </Label>
  );
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

let listener;

Keyboard.addListener('keyboardDidHide', () => listener?.());

const GasSpeedButton = ({
  dontBlur,
  horizontalPadding = 19,
  onCustomGasBlur,
  onCustomGasFocus,
  testID,
  type,
  theme = 'dark',
  topPadding = 15,
  options = null,
  minGasPrice = null,
  currentNetwork,
}) => {
  const { colors } = useTheme();
  const inputRef = useRef(null);
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

  const gasPrice = get(selectedGasPrice, 'txFee.native.value.display');
  const customGasPriceTimeEstimateHandler = useRef(null);
  useEffect(() => {
    listener = () => {
      inputRef.current?.blur();
    };

    return () => {
      listener = undefined;
    };
  }, []);

  const [customGasPriceInput, setCustomGasPriceInput] = useState(0);
  const [estimatedTimeValue, setEstimatedTimeValue] = useState(0);
  const [estimatedTimeUnit, setEstimatedTimeUnit] = useState('min');
  const [inputFocused, setInputFocused] = useState(false);
  const { nativeCurrencySymbol, nativeCurrency } = useAccountSettings();

  const defaultCustomGasPrice = Math.round(
    weiToGwei(gasPricesAvailable?.fast?.value?.amount)
  );
  const defaultCustomGasPriceNative = get(
    txFees?.fast,
    'txFee.native.value.display'
  );
  const defaultCustomGasConfirmationTime =
    gasPricesAvailable?.fast?.estimatedTime?.display;

  // Because of the animated number component
  // we need to trim the native currency symbol
  // (and leave the number only!)
  // which gets added later in the formatGasPrice function
  const price = (isNil(gasPrice) ? '0.00' : gasPrice)
    .replace(nativeCurrencySymbol, '')
    .trim();

  const formatGasPrice = useCallback(
    animatedValue => {
      // L2's are very cheap,
      // so let's default to the last 2 significant decimals
      if (isL2Network(currentNetwork)) {
        return `${nativeCurrencySymbol}${Number.parseFloat(
          animatedValue
        ).toPrecision(2)}`;
      } else {
        return `${nativeCurrencySymbol}${
          nativeCurrency === 'ETH'
            ? (Math.ceil(Number(animatedValue) * 10000) / 10000).toFixed(4)
            : (Math.ceil(Number(animatedValue) * 100) / 100).toFixed(2)
        }`;
      }
    },
    [currentNetwork, nativeCurrencySymbol, nativeCurrency]
  );

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
        await updateCustomValues(price, currentNetwork);
        updateGasPriceOption(CUSTOM, currentNetwork);
      } catch (e) {
        setEstimatedTimeValue(0);
        setEstimatedTimeUnit('min');
      }
    },
    [currentNetwork, updateCustomValues, updateGasPriceOption]
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
            ? colors.whiteLabel
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
    [colors, gasPricesAvailable, isSufficientGas, theme, txFees]
  );

  const handlePress = useCallback(() => {
    if (inputFocused) {
      return;
    }
    LayoutAnimation.easeInEaseOut();
    const gasOptions = options || GasSpeedOrder;
    const currentSpeedIndex = gasOptions?.indexOf(selectedGasPriceOption);
    const nextSpeedIndex = (currentSpeedIndex + 1) % gasOptions?.length;

    const nextSpeed = gasOptions[nextSpeedIndex];
    updateGasPriceOption(nextSpeed);
  }, [inputFocused, options, selectedGasPriceOption, updateGasPriceOption]);

  const formatBottomRightLabel = useCallback(() => {
    const actionLabel = getActionLabel(type);
    const time = parseFloat(estimatedTimeValue || 0).toFixed(0);
    let gasPriceGwei = get(selectedGasPrice, 'value.display');
    if (gasPriceGwei === '0 Gwei') {
      gasPriceGwei = '< 1 Gwei';
    }
    let timeSymbol = '~';

    if (selectedGasPriceOption === CUSTOM) {
      if (!customGasPriceInput) {
        return `${defaultCustomGasPriceNative} ~ ${defaultCustomGasConfirmationTime}`;
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

        return `${gasPrice} ${timeSymbol} ${time} ${estimatedTimeUnit}`;
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
    defaultCustomGasPriceNative,
    estimatedTimeUnit,
    estimatedTimeValue,
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

    const minKey = options?.indexOf(SLOW) !== -1 ? SLOW : NORMAL;

    const minGasPriceAllowed = Number(
      gasPricesAvailable?.[minKey]?.value?.amount || 0
    );

    // The minimum gas for the tx is the higher amount between:
    // - 10% more than the submitted gas of the previous tx (If speeding up / cancelling)
    // - The new "normal" gas price from our third party API

    const minimumGasAcceptedForTx = minGasPrice
      ? Math.max(minGasPrice, minGasPriceAllowed)
      : minGasPriceAllowed;

    if (minGasPrice && Number(customGasPriceInput) < minimumGasAcceptedForTx) {
      Alert({
        buttons: [
          {
            onPress: () => inputRef.current?.focus(),
            text: 'OK',
          },
        ],
        message: `The minimum gas price valid allowed is ${minimumGasAcceptedForTx} GWEI`,
        title: 'Gas Price Too Low',
      });
      return;
    }

    const priceInWei = gweiToWei(customGasPriceInput);
    const maxGasPriceFast = Number(
      gasPricesAvailable?.fast?.value?.amount || 0
    );
    let tooLow = priceInWei < minGasPriceAllowed;
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
    options,
    gasPricesAvailable,
    minGasPrice,
    dontBlur,
    handleCustomGasBlur,
  ]);

  const focusOnInput = useCallback(() => inputRef.current?.focus(), []);
  const isCustom = selectedGasPriceOption === CUSTOM ? true : false;

  const { navigate } = useNavigation();

  const openGasHelper = useCallback(() => {
    Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, { type: 'gas' });
  }, [navigate]);

  return (
    <Container
      as={ScaleButtonZoomableAndroid}
      horizontalPadding={horizontalPadding}
      onPress={handlePress}
      testID={testID}
      topPadding={topPadding}
    >
      <Column>
        <Row align="end" height={30} justify="start">
          {!isCustom ? (
            <ButtonPressAnimation onPress={handlePress} reanimatedButton>
              <View pointerEvents="none">
                <AnimatedNumber
                  formatter={formatGasPrice}
                  interval={6}
                  renderContent={renderGasPriceText}
                  steps={6}
                  textAlign="left"
                  timing="linear"
                  value={price}
                />
              </View>
            </ButtonPressAnimation>
          ) : (
            <BorderlessButton onPress={focusOnInput}>
              <Row>
                <GasInput
                  gasTheme={theme}
                  onBlur={handleCustomGasBlur}
                  onChangeText={handleCustomGasChange}
                  onFocus={handleCustomGasFocus}
                  onSubmitEditing={handleInputButtonManager} // see PR #1385
                  placeholder={`${defaultCustomGasPrice} `}
                  ref={inputRef}
                  value={customGasPriceInput}
                />
                <Text
                  color={
                    customGasPriceInput
                      ? theme === 'dark'
                        ? colors.whiteLabel
                        : colors.alpha(colors.blueGreyDark, 0.8)
                      : theme === 'dark'
                      ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.3)
                      : colors.alpha(colors.blueGreyDark, 0.3)
                  }
                  size="lmedium"
                  weight="bold"
                >
                  {ios && ' '}
                  Gwei
                </Text>
              </Row>
            </BorderlessButton>
          )}
        </Row>

        <Row justify="space-between" style={{ marginTop: isCustom ? -3 : 0 }}>
          {!isCustom ? (
            <ButtonPressAnimation
              onPress={openGasHelper}
              style={{ marginTop: -7, zIndex: 10 }}
              wrapperStyle={{ zIndex: 10 }}
            >
              <Label
                color={
                  theme === 'dark'
                    ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.6)
                    : colors.alpha(colors.blueGreyDark, 0.6)
                }
              >
                Network Fee{' '}
                <Label
                  color={
                    theme === 'dark'
                      ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.4)
                      : colors.alpha(colors.blueGreyDark, 0.4)
                  }
                >
                  􀅵
                </Label>
              </Label>
            </ButtonPressAnimation>
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
        </Row>
      </Column>
      <Column
        align="end"
        as={ButtonPressAnimation}
        onPress={handlePress}
        reanimatedButton
        wrapperStyle={{ flex: 1 }}
      >
        <Row align="end" justify="end" marginBottom={1}>
          <GasSpeedLabelPager
            label={selectedGasPriceOption}
            options={options}
            showPager={!inputFocused}
            theme={theme}
          />
        </Row>

        <Row justify="space-between">
          <BottomRightLabel
            formatter={formatBottomRightLabel}
            theme={theme}
            value={{
              estimatedTimeValue,
              price: selectedGasPrice?.value?.display,
            }}
          />
        </Row>
      </Column>
    </Container>
  );
};

export default magicMemo(GasSpeedButton, 'type');
