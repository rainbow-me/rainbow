import AnimateNumber from '@bankify/react-native-animate-number';
import { get, isEmpty, isNil, upperFirst } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LayoutAnimation } from 'react-native';
import {
  BorderlessButton,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import styled from 'styled-components';
import { darkModeThemeColors } from '../../styles/colors';
import { Alert } from '../alerts';
import { ButtonPressAnimation } from '../animations';
import { Input } from '../inputs';
import { Column, Row } from '../layout';
import { Text } from '../text';
import GasSpeedLabelPager from './GasSpeedLabelPager';
import { isL2Network } from '@rainbow-me/handlers/web3';
import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';
import { useAccountSettings, useGas } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { gweiToWei, weiToGwei } from '@rainbow-me/parsers';
import Routes from '@rainbow-me/routes';
import { padding } from '@rainbow-me/styles';
import {
  gasUtils,
  magicMemo,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';
import { ContextMenuButton } from 'react-native-ios-context-menu';

const { GasSpeedOrder, CUSTOM, FAST, NORMAL, SLOW } = gasUtils;

const Container = styled(Column).attrs({
  hapticType: 'impactHeavy',
  scaleTo: 1.0666,
})`
  ${({ horizontalPadding, topPadding }) =>
    padding(topPadding, horizontalPadding, 0)};
  height: 76;
  width: 100%;
`;

const Label = styled(Text).attrs(({ size, weight }) => ({
  size: size || 'lmedium',
  weight: weight || 'semibold',
}))``;

const ButtonLabel = styled(BorderlessButton).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
  hitSlop: 40,
  opacity: 1,
  size: 'smedium',
  weight: 'bold',
}))`
  padding-bottom: 10;
`;

const LittleBorderlessButton = ({ onPress, children, testID }) => {
  const { colors } = useTheme();
  return (
    <ButtonLabel onPress={onPress} testID={testID} width={120}>
      <Text color={colors.appleBlue} size="smedium" weight="bold">
        {children}
      </Text>
    </ButtonLabel>
  );
};

const TransactionTimeLabel = ({ formatter, theme }) => {
  const { colors } = useTheme();
  return (
    <Label
      align="right"
      color={
        theme === 'dark'
          ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.6)
          : colors.alpha(colors.blueGreyDark, 0.6)
      }
      size="lmedium"
      weight="bold"
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
  console.log({ options, GasSpeedOrder });
  const { colors } = useTheme();
  const inputRef = useRef(null);
  // eip 1559
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
    .replace(',', '') // In case gas price is > 1k!
    .replace(nativeCurrencySymbol, '')
    .trim();

  const formatGasPrice = useCallback(
    animatedValue => {
      // L2's are very cheap,
      // so let's default to the last 2 significant decimals
      if (isL2Network(currentNetwork)) {
        const numAnimatedValue = Number.parseFloat(animatedValue);
        if (numAnimatedValue < 0.01) {
          return `${nativeCurrencySymbol}${numAnimatedValue.toPrecision(2)}`;
        } else {
          return `${nativeCurrencySymbol}${numAnimatedValue.toFixed(2)}`;
        }
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

  const formatTransactionTime = useCallback(() => {
    const time = parseFloat(estimatedTimeValue || 0).toFixed(0);
    let gasPriceGwei = get(selectedGasPrice, 'value.display');
    if (gasPriceGwei === '0 Gwei') {
      gasPriceGwei = '< 1 Gwei';
    }
    let timeSymbol = '~';

    if (selectedGasPriceOption === CUSTOM) {
      if (!customGasPriceInput) {
        return ` ${timeSymbol}${defaultCustomGasConfirmationTime}`;
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

        return ` ${timeSymbol}${time} ${estimatedTimeUnit}`;
      } else {
        return ``;
      }
    }

    // If it's still loading show `...`
    if (time === '0' && estimatedTimeUnit === 'min') {
      return ``;
    }

    return ` ${timeSymbol}${time} ${estimatedTimeUnit}`;
  }, [
    customGasPriceInput,
    defaultCustomGasConfirmationTime,
    defaultCustomGasPriceNative,
    estimatedTimeUnit,
    estimatedTimeValue,
    gasPricesAvailable,
    selectedGasPrice,
    selectedGasPriceOption,
  ]);

  useEffect(() => {
    const gasOptions = options || GasSpeedOrder;
    const currentSpeedIndex = gasOptions?.indexOf(selectedGasPriceOption);
    // If the option isn't available anymore, we need to reset it
    if (currentSpeedIndex === -1) {
      handlePress();
    }
  }, [handlePress, options, selectedGasPriceOption]);

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

  const openGasHelper = useCallback(
    () => navigate(Routes.EXPLAIN_SHEET, { type: 'gas' }),
    [navigate]
  );

  const ContactRowActionsEnum = {
    blockExplorer: 'blockExplorer',
    copyAddress: 'copyAddress',
  };

  const ContactRowActions = {
    [ContactRowActionsEnum.copyAddress]: {
      actionKey: ContactRowActionsEnum.copyAddress,
      actionTitle: 'Copy Address',
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'doc.on.doc',
      },
    },
  };

  const handlePressMenuItem = useCallback(({ nativeEvent: { actionKey } }) => {
    console.log('actionKey: ', actionKey);
  }, []);

  const buildGasButtonMenuOptions = () =>
    options.map(gasOption => ({
      actionKey: gasOption,
      actionTitle: upperFirst(gasOption),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'safari',
      },
    }));

  const menuConfig = useMemo(() => {
    const menuOptions = buildGasButtonMenuOptions();
    return {
      menuItems: menuOptions,
      menuTitle: `Gas Speeds`,
    };
  }, []);
  const onPressAndroid = useCallback(() => {
    const androidContractActions = ['Copy Contract Address', 'x', 'Cancel'];
    showActionSheetWithOptions(
      {
        cancelButtonIndex: 2,
        options: androidContractActions,
        showSeparators: true,
        title: `hi`,
      },
      idx => {
        if (idx === 0) {
          // handleCopyAddress(item?.address);
        }
        if (idx === 1) {
          // ethereumUtils.openAddressInBlockExplorer(item?.address, network);
        }
      }
    );
  }, []);

  return (
    <Container
      horizontalPadding={horizontalPadding}
      testID={testID}
      topPadding={topPadding}
    >
      <Row align="center" justify="space-between" marginBottom={1.5}>
        <Column>
          <ButtonPressAnimation onPress={openGasHelper}>
            <Row>
              <Column>
                <AnimateNumber
                  formatter={formatGasPrice}
                  interval={6}
                  renderContent={renderGasPriceText}
                  steps={6}
                  timing="linear"
                  value={price}
                />
              </Column>
              <Column>
                <TransactionTimeLabel
                  formatter={formatTransactionTime}
                  theme={theme}
                  value={{
                    estimatedTimeValue,
                    price: selectedGasPrice?.value?.display,
                  }}
                />
              </Column>
            </Row>
            <Row justify="space-between">
              <Label
                color={
                  theme === 'dark'
                    ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.6)
                    : colors.alpha(colors.blueGreyDark, 0.6)
                }
                size="smedium"
              >
                Estimated Fee{' '}
                <Label
                  color={
                    theme === 'dark'
                      ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.4)
                      : colors.alpha(colors.blueGreyDark, 0.4)
                  }
                  size="smedium"
                >
                  􀅵
                </Label>
              </Label>
            </Row>
          </ButtonPressAnimation>
        </Column>
        <Column>
          <ContextMenuButton
            activeOpacity={0}
            menuConfig={menuConfig}
            {...(android ? { onPress: onPressAndroid } : {})}
            isMenuPrimaryAction
            onPressMenuItem={handlePressMenuItem}
            useActionSheetFallback={false}
            wrapNativeComponent={false}
          >
            <GasSpeedLabelPager
              label={selectedGasPriceOption}
              onPress={handlePress}
              showPager={!inputFocused}
              theme={theme}
            />
          </ContextMenuButton>
        </Column>
      </Row>
    </Container>
  );
};

export default magicMemo(GasSpeedButton, 'type');
