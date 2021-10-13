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
import { ContextMenuButton } from 'react-native-ios-context-menu';
import styled from 'styled-components';
import { darkModeThemeColors, lightModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { ChainBadge, CoinIcon } from '../coin-icon';
import { Column, Row } from '../layout';
import { Text } from '../text';
import GasSpeedLabelPager from './GasSpeedLabelPager';
import { isL2Network } from '@rainbow-me/handlers/web3';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  useAccountSettings,
  useColorForAsset,
  useGas,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { ETH_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { margin, padding } from '@rainbow-me/styles';
import {
  gasUtils,
  magicMemo,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';

const { GAS_ICONS, GasSpeedOrder, CUSTOM, URGENT, NORMAL, FAST } = gasUtils;

const Symbol = styled(Text).attrs({
  align: 'right',
  size: 'lmedium',
  weight: 'heavy',
})`
  margin-left: ${({ nextToText }) => (nextToText ? 5 : 0)};
`;

const CustomGasButton = styled(ButtonPressAnimation).attrs({
  hapticType: 'impactHeavy',
  scaleTo: 0.9,
})`
  // border: ${({ theme: { colors } }) => `2px solid ${colors.mediumGrey}`};
  // TODO: put this shade in theme colors
  border: 2px solid rgba(224, 232, 255, 0.15);
  border-radius: 15px;
  ${padding(3, 5)};
  ${margin(0, 0, 0, 8)}
  )
`;

const ChainBadgeContainer = styled.View.attrs({
  hapticType: 'impactHeavy',
  scaleTo: 0.9,
})`
  ${padding(3, 0)};
  ${margin(0, 0, 0, 8)};
`;

const NativeCoinIconWrapper = styled(Column)`
  ${margin(0, 5, 0, 0)};
`;

const Container = styled(Column).attrs({
  hapticType: 'impactHeavy',
})`
  ${({ horizontalPadding, topPadding }) =>
    padding(topPadding, horizontalPadding, 0)};
  height: 91;
  width: 100%;
`;

const Label = styled(Text).attrs(({ size, weight }) => ({
  size: size || 'lmedium',
  weight: weight || 'semibold',
}))``;

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

const GasSpeedButton = ({
  // dontBlur,
  showGasOptions = false,
  horizontalPadding = 19,
  testID,
  // type,
  theme = 'dark',
  topPadding = 15,
  options = null,
  currentNetwork,
  asset,
}) => {
  const customGasPriceTimeEstimateHandler = useRef(null);
  const { colors } = useTheme();
  const { navigate, goBack } = useNavigation();
  const { nativeCurrencySymbol, nativeCurrency } = useAccountSettings();
  const colorForAsset = useColorForAsset(asset || {});

  // if ETH color, use blueApple
  const assetColor = useMemo(() => {
    if (colorForAsset === colors.brighten(lightModeThemeColors.dark)) {
      return colors.appleBlue;
    }
    return colorForAsset;
  }, [colorForAsset, colors]);

  const {
    gasFeeParamsBySpeed,
    gasFeesBySpeed,
    updateCustomValues,
    isSufficientGas,
    updateGasFeeOption,
    selectedGasFee,
    selectedGasFeeOption,
  } = useGas();

  const [customGasPriceInput] = useState(0);
  const [estimatedTimeValue, setEstimatedTimeValue] = useState(0);
  const [estimatedTimeUnit, setEstimatedTimeUnit] = useState('min');
  const [inputFocused] = useState(false);

  // Because of the animated number component
  // we need to trim the native currency symbol
  // (and leave the number only!)
  // which gets added later in the formatGasPrice function
  const price = useMemo(() => {
    const gasPrice = get(
      selectedGasFee,
      `gasFee.estimatedFee.native.value.display`
    );
    const price = (isNil(gasPrice) ? '0.00' : gasPrice)
      .replace(',', '') // In case gas price is > 1k!
      .replace(nativeCurrencySymbol, '')
      .trim();
    return price;
  }, [nativeCurrencySymbol, selectedGasFee]);

  const isL2 = useMemo(() => isL2Network(currentNetwork), [currentNetwork]);

  const formatGasPrice = useCallback(
    animatedValue => {
      // L2's are very cheap,
      // so let's default to the last 2 significant decimals
      if (isL2) {
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
    [isL2, nativeCurrencySymbol, nativeCurrency]
  );

  const calculateCustomPriceEstimatedTime = useCallback(
    async price => {
      try {
        await updateCustomValues(price, currentNetwork);
        updateGasFeeOption(CUSTOM);
      } catch (e) {
        setEstimatedTimeValue(0);
        setEstimatedTimeUnit('min');
      }
    },
    [currentNetwork, updateCustomValues, updateGasFeeOption]
  );

  const gasIsNotReady = useMemo(
    () =>
      isEmpty(gasFeeParamsBySpeed) ||
      isEmpty(selectedGasFee?.gasFee) ||
      typeof isSufficientGas === 'undefined',
    [gasFeeParamsBySpeed, selectedGasFee?.gasFee, isSufficientGas]
  );

  const openCustomGasSheet = useCallback(() => {
    if (gasIsNotReady) return;
    navigate(Routes.CUSTOM_GAS_SHEET, {
      asset,
      // restoreFocusOnSwapModal: () => {
      //   android &&
      //     (lastFocusedInputHandle.current = lastFocusedInputHandleTemporary);
      //   setParams({ focused: true });
      // },
      type: 'custom_gas',
    });
  }, [navigate, asset, gasIsNotReady]);

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
        {gasIsNotReady ? 'Loading...' : animatedNumber}
      </Text>
    ),
    [theme, colors, gasIsNotReady]
  );

  const handlePress = useCallback(
    selectedSpeed => {
      if (inputFocused) {
        return;
      }
      LayoutAnimation.easeInEaseOut();
      updateGasFeeOption(selectedSpeed);
    },
    [inputFocused, updateGasFeeOption]
  );

  // TODO
  const formatTransactionTime = useCallback(() => {
    const time = parseFloat(estimatedTimeValue || 0).toFixed(0);
    let selectedGasFeeGwei = get(
      selectedGasFee,
      'estimatedFee.value.display.display'
    );
    if (selectedGasFeeGwei === '0 Gwei') {
      selectedGasFeeGwei = '< 1 Gwei';
    }
    let timeSymbol = '~';

    if (selectedGasFeeOption === CUSTOM) {
      const customWei = get(
        gasFeesBySpeed,
        `${CUSTOM}.estimatedFee.value.amount`
      );
      if (customWei) {
        const normalWei = get(
          gasFeesBySpeed,
          `${NORMAL}.estimatedFee.value.amount`
        );
        const urgentWei = get(
          gasFeesBySpeed,
          `${URGENT}.estimatedFee.value.amount`
        );
        const minGasPriceSlow = normalWei | urgentWei;
        const maxGasPriceFast = urgentWei;
        if (normalWei < minGasPriceSlow) {
          timeSymbol = '>';
        } else if (normalWei > maxGasPriceFast) {
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
    estimatedTimeUnit,
    estimatedTimeValue,
    gasFeesBySpeed,
    selectedGasFee,
    selectedGasFeeOption,
  ]);

  const openGasHelper = useCallback(
    () => navigate(Routes.EXPLAIN_SHEET, { type: 'gas' }),
    [navigate]
  );

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      handlePress(actionKey);
    },
    [handlePress]
  );

  const nativeFeeCurrencySymbol = useMemo(() => {
    switch (currentNetwork) {
      case networkTypes.polygon:
        return { address: ETH_ADDRESS, symbol: 'MATIC' };
      case networkTypes.optimism:
      case networkTypes.arbitrum:
      default:
        return { address: ETH_ADDRESS, symbol: 'ETH' };
    }
  }, [currentNetwork]);

  const speedOptions = useMemo(() => {
    if (options) return options;
    switch (currentNetwork) {
      case networkTypes.polygon:
        return [NORMAL, FAST, URGENT];
      case networkTypes.optimism:
      case networkTypes.arbitrum:
        return ['normal'];
      default:
        return GasSpeedOrder;
    }
  }, [currentNetwork, options]);

  const menuConfig = useMemo(() => {
    const menuOptions = speedOptions.map(gasOption => ({
      actionKey: gasOption,
      actionTitle: upperFirst(gasOption),
      icon: {
        iconType: 'SYSTEM',
        iconValue: GAS_ICONS[gasOption],
      },
    }));
    return {
      menuItems: menuOptions,
      menuTitle: `Transaction Speed`,
    };
  }, [speedOptions]);

  // TODO
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

  useEffect(() => {
    const gasOptions = options || GasSpeedOrder;
    const currentSpeedIndex = gasOptions?.indexOf(selectedGasFeeOption);
    // If the option isn't available anymore, we need to reset it
    if (currentSpeedIndex === -1) {
      handlePress();
    }
  }, [handlePress, options, selectedGasFeeOption]);

  useEffect(() => {
    if (selectedGasFeeOption === gasUtils.CUSTOM) {
      openCustomGasSheet();
    }
  }, [navigate, openCustomGasSheet, selectedGasFeeOption]);

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

  useEffect(() => {
    const estimatedTime = get(
      selectedGasFee,
      'estimatedTime.display',
      ''
    ).split(' ');

    setEstimatedTimeValue(estimatedTime[0] || 0);
    setEstimatedTimeUnit(estimatedTime[1] || 'min');
  }, [selectedGasFee, selectedGasFeeOption]);

  return (
    <Container
      horizontalPadding={horizontalPadding}
      testID={testID}
      topPadding={topPadding}
    >
      <Row align="center" justify="space-between">
        <Column>
          <ButtonPressAnimation onPress={openGasHelper}>
            <Row>
              <NativeCoinIconWrapper>
                <CoinIcon
                  address={nativeFeeCurrencySymbol.address}
                  size={18}
                  symbol={nativeFeeCurrencySymbol.symbol}
                />
              </NativeCoinIconWrapper>
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
                    price,
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
          {showGasOptions ? (
            <GasSpeedLabelPager
              colorForAsset={assetColor}
              label={selectedGasFeeOption}
              onPress={goBack}
              showGasOptions={showGasOptions}
              showPager={!inputFocused}
              theme={theme}
            />
          ) : (
            <Row>
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
                    colorForAsset={assetColor}
                    label={selectedGasFeeOption}
                    showGasOptions={showGasOptions}
                    showPager={!inputFocused}
                    theme={theme}
                  />
                </ContextMenuButton>
              </Column>
              <Column justify="center">
                {isL2 ? (
                  <ChainBadgeContainer>
                    <ChainBadge
                      assetType={currentNetwork}
                      position="relative"
                    />
                  </ChainBadgeContainer>
                ) : (
                  <CustomGasButton onPress={openCustomGasSheet}>
                    <Symbol
                      color={
                        theme !== 'light'
                          ? colors.whiteLabel
                          : colors.alpha(colors.blueGreyDark, 0.8)
                      }
                    >
                      􀌆
                    </Symbol>
                  </CustomGasButton>
                )}
              </Column>
            </Row>
          )}
        </Column>
      </Row>
    </Container>
  );
};

export default magicMemo(GasSpeedButton, 'type');
