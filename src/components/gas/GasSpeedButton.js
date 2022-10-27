import AnimateNumber from '@bankify/react-native-animate-number';
import lang from 'i18n-js';
import { isEmpty, isNaN, isNil, upperFirst } from 'lodash';
import makeColorMoreChill from 'make-color-more-chill';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager, Keyboard } from 'react-native';
import { darkModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { ChainBadge, CoinIcon } from '../coin-icon';
import { Centered, Column, Row } from '../layout';
import { Text } from '../text';
import { GasSpeedLabelPager } from '.';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { isL2Network } from '@/handlers/web3';
import networkInfo from '@/helpers/networkInfo';
import networkTypes from '@/helpers/networkTypes';
import { add, greaterThan, toFixedDecimals } from '@/helpers/utilities';
import { getCrossChainTimeEstimate } from '@/utils/crossChainTimeEstimates';
import {
  useAccountSettings,
  useColorForAsset,
  useGas,
  usePrevious,
  useSwapCurrencies,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import {
  BNB_BSC_ADDRESS,
  ETH_ADDRESS,
  MATIC_MAINNET_ADDRESS,
} from '@/references';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { fonts, fontWithWidth, margin, padding } from '@/styles';
import { gasUtils } from '@/utils';

const {
  GAS_EMOJIS,
  GAS_ICONS,
  GasSpeedOrder,
  CUSTOM,
  URGENT,
  NORMAL,
  FAST,
} = gasUtils;

const CustomGasButton = styled(ButtonPressAnimation).attrs({
  align: 'center',
  alignItems: 'center',
  hapticType: 'impactHeavy',
  height: 30,
  justifyContent: 'center',
  scaleTo: 0.8,
})({
  borderColor: ({ borderColor, color, theme: { colors } }) =>
    borderColor || color || colors.appleBlue,
  borderRadius: 19,
  borderWidth: 2,
  ...padding.object(android ? 2 : 3, 0),
});

const Symbol = styled(Text).attrs({
  align: 'center',
  alignItems: 'center',
  lineHeight: 'normal',
  size: 'lmedium',
  weight: 'heavy',
})({
  ...padding.object(android ? 1 : 0, 6, 0, 7),
});

const DoneCustomGas = styled(Text).attrs({
  align: 'center',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 'normal',
  size: 'lmedium',
  weight: 'heavy',
})({
  ...padding.object(0),
  ...margin.object(0, 10),
  bottom: 0.5,
});

const ChainBadgeContainer = styled.View.attrs({
  hapticType: 'impactHeavy',
  scaleTo: 0.9,
})({
  ...padding.object(0),
  ...margin.object(0),
});

const NativeCoinIconWrapper = styled(Column)(margin.object(1.5, 5, 0, 0));

const Container = styled(Column).attrs({
  alignItems: 'center',
  hapticType: 'impactHeavy',
  justifyContent: 'center',
})(({ marginBottom, marginTop, horizontalPadding }) => ({
  ...margin.object(marginTop, 0, marginBottom),
  ...padding.object(0, horizontalPadding),
  width: '100%',
}));

const Label = styled(Text).attrs(({ size }) => ({
  lineHeight: 'normal',
  size: size || 'lmedium',
}))(({ weight }) => fontWithWidth(weight || fonts.weight.semibold));

const GasSpeedPagerCentered = styled(Centered).attrs(() => ({
  marginRight: 8,
}))({});

const TextContainer = styled(Column).attrs(() => ({}))({});

const TransactionTimeLabel = ({ formatter, isLongWait, theme }) => {
  const { colors } = useTheme();
  let color =
    theme === 'dark'
      ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.6)
      : colors.alpha(colors.blueGreyDark, 0.6);

  if (isLongWait) {
    color = colors.lightOrange;
  }

  return (
    <Label align="right" color={color} size="lmedium" weight="bold">
      {formatter()}
    </Label>
  );
};

const GasSpeedButton = ({
  asset,
  currentNetwork,
  horizontalPadding = 19,
  marginBottom = 20,
  marginTop = 18,
  speeds = null,
  showGasOptions = false,
  testID,
  theme = 'dark',
  canGoBack = true,
  validateGasParams,
  flashbotTransaction = false,
  crossChainServiceTime,
}) => {
  const { colors } = useTheme();
  const { navigate, goBack } = useNavigation();
  const { nativeCurrencySymbol, nativeCurrency } = useAccountSettings();
  const rawColorForAsset = useColorForAsset(asset || {}, null, false, true);
  const [isLongWait, setIsLongWait] = useState(false);

  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const {
    gasFeeParamsBySpeed,
    updateGasFeeOption,
    selectedGasFee,
    selectedGasFeeOption,
    currentBlockParams,
  } = useGas();

  const [gasPriceReady, setGasPriceReady] = useState(false);
  const [shouldOpenCustomGasSheet, setShouldOpenCustomGasSheet] = useState({
    focusTo: null,
    shouldOpen: false,
  });
  const prevShouldOpenCustomGasSheet = usePrevious(shouldOpenCustomGasSheet);

  // Because of the animated number component
  // we need to trim the native currency symbol
  // (and leave the number only!)
  // which gets added later in the formatGasPrice function
  const price = useMemo(() => {
    const gasPrice =
      selectedGasFee?.gasFee?.estimatedFee?.native?.value?.display;
    if (isNil(gasPrice)) return null;
    return gasPrice
      .replace(',', '') // In case gas price is > 1k!
      .replace(nativeCurrencySymbol, '')
      .trim();
  }, [nativeCurrencySymbol, selectedGasFee]);

  const isL2 = useMemo(() => isL2Network(currentNetwork), [currentNetwork]);

  const gasIsNotReady = useMemo(
    () =>
      isNil(price) ||
      isEmpty(gasFeeParamsBySpeed) ||
      isEmpty(selectedGasFee?.gasFee),
    [gasFeeParamsBySpeed, price, selectedGasFee]
  );

  const formatGasPrice = useCallback(
    animatedValue => {
      if (animatedValue === null || isNaN(animatedValue)) {
        return 0;
      }
      !gasPriceReady && setGasPriceReady(true);
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
    [gasPriceReady, isL2, nativeCurrencySymbol, nativeCurrency]
  );

  const openCustomOptionsRef = useRef();

  const openCustomGasSheet = useCallback(() => {
    if (gasIsNotReady) return;
    navigate(Routes.CUSTOM_GAS_SHEET, {
      asset,
      flashbotTransaction,
      focusTo: shouldOpenCustomGasSheet.focusTo,
      openCustomOptions: focusTo => openCustomOptionsRef.current(focusTo),
      speeds: speeds ?? GasSpeedOrder,
      type: 'custom_gas',
    });
  }, [
    gasIsNotReady,
    navigate,
    asset,
    shouldOpenCustomGasSheet.focusTo,
    flashbotTransaction,
    speeds,
  ]);

  const openCustomOptions = useCallback(
    focusTo => {
      if (ios) {
        setShouldOpenCustomGasSheet({ focusTo, shouldOpen: true });
      } else {
        openCustomGasSheet();
      }
    },
    [openCustomGasSheet]
  );

  openCustomOptionsRef.current = openCustomOptions;

  const renderGasPriceText = useCallback(
    animatedNumber => {
      const priceText =
        animatedNumber === 0 ? lang.t('swap.loading') : animatedNumber;
      return (
        <Text
          color={
            theme === 'dark'
              ? colors.whiteLabel
              : colors.alpha(colors.blueGreyDark, 0.8)
          }
          lineHeight="normal"
          size="lmedium"
          weight="heavy"
        >
          {priceText}
        </Text>
      );
    },
    [theme, colors]
  );

  // I'M SHITTY CODE BUT GOT THINGS DONE REFACTOR ME ASAP
  const handlePressSpeedOption = useCallback(
    selectedSpeed => {
      if (selectedSpeed === CUSTOM) {
        if (ios) {
          InteractionManager.runAfterInteractions(() => {
            setShouldOpenCustomGasSheet({
              focusTo: null,
              shouldOpen: true,
            });
          });
        } else {
          openCustomGasSheet();
          setTimeout(() => updateGasFeeOption(selectedSpeed), 500);
          return;
        }
      }
      updateGasFeeOption(selectedSpeed);
    },
    [updateGasFeeOption, openCustomGasSheet]
  );

  const formatTransactionTime = useCallback(() => {
    if (!gasPriceReady || !selectedGasFee?.estimatedTime?.display) return '';
    // override time estimate for cross chain swaps
    if (crossChainServiceTime) {
      const { isLongWait, timeEstimateDisplay } = getCrossChainTimeEstimate({
        serviceTime: crossChainServiceTime,
        gasTimeInSeconds: selectedGasFee?.estimatedTime?.amount,
      });
      setIsLongWait(isLongWait);
      return timeEstimateDisplay;
    }

    const estimatedTime = (selectedGasFee?.estimatedTime?.display || '').split(
      ' '
    );
    const [estimatedTimeValue = 0, estimatedTimeUnit = 'min'] = estimatedTime;
    const time = parseFloat(estimatedTimeValue).toFixed(0);

    const timeSymbol = estimatedTimeUnit === 'hr' ? '>' : '~';
    if (!estimatedTime || (time === '0' && estimatedTimeUnit === 'min')) {
      return '';
    }
    return `${timeSymbol}${time} ${estimatedTimeUnit}`;
  }, [
    crossChainServiceTime,
    gasPriceReady,
    selectedGasFee?.estimatedTime?.amount,
    selectedGasFee?.estimatedTime?.display,
  ]);

  const openGasHelper = useCallback(() => {
    Keyboard.dismiss();
    const network = currentNetwork ?? networkTypes.mainnet;
    const networkName = networkInfo[network]?.name;
    if (crossChainServiceTime) {
      navigate(Routes.EXPLAIN_SHEET, {
        inputCurrency,
        outputCurrency,
        type: 'crossChainGas',
      });
    } else {
      navigate(Routes.EXPLAIN_SHEET, { network: networkName, type: 'gas' });
    }
  }, [
    crossChainServiceTime,
    currentNetwork,
    inputCurrency,
    navigate,
    outputCurrency,
  ]);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      handlePressSpeedOption(actionKey);
    },
    [handlePressSpeedOption]
  );

  const nativeFeeCurrency = useMemo(() => {
    switch (currentNetwork) {
      case networkTypes.polygon:
        return { mainnet_address: MATIC_MAINNET_ADDRESS, symbol: 'MATIC' };
      case networkTypes.bsc:
        return { mainnet_address: BNB_BSC_ADDRESS, symbol: 'BNB' };
      case networkTypes.optimism:
      case networkTypes.arbitrum:
      default:
        return { mainnet_address: ETH_ADDRESS, symbol: 'ETH' };
    }
  }, [currentNetwork]);

  const speedOptions = useMemo(() => {
    if (speeds) return speeds;
    switch (currentNetwork) {
      case networkTypes.polygon:
        return [NORMAL, FAST, URGENT];
      case networkTypes.optimism:
      case networkTypes.arbitrum:
      case networkTypes.bsc:
        return [NORMAL, FAST, URGENT];
      default:
        return GasSpeedOrder;
    }
  }, [currentNetwork, speeds]);

  const menuConfig = useMemo(() => {
    const menuOptions = speedOptions.map(gasOption => {
      const totalGwei = add(
        gasFeeParamsBySpeed[gasOption]?.maxBaseFee?.gwei,
        gasFeeParamsBySpeed[gasOption]?.maxPriorityFeePerGas?.gwei
      );
      const estimatedGwei = add(
        currentBlockParams?.baseFeePerGas?.gwei,
        gasFeeParamsBySpeed[gasOption]?.maxPriorityFeePerGas?.gwei
      );
      const gweiDisplay =
        currentNetwork === networkTypes.polygon ||
        currentNetwork === networkTypes.bsc
          ? gasFeeParamsBySpeed[gasOption]?.gasPrice?.display
          : gasOption === 'custom' && selectedGasFeeOption !== 'custom'
          ? ''
          : greaterThan(estimatedGwei, totalGwei)
          ? `${toFixedDecimals(totalGwei, 0)} Gwei`
          : `${toFixedDecimals(estimatedGwei, 0)}–${toFixedDecimals(
              totalGwei,
              0
            )} Gwei`;
      return {
        actionKey: gasOption,
        actionTitle:
          (android ? `${GAS_EMOJIS[gasOption]}  ` : '') + upperFirst(gasOption),
        discoverabilityTitle: gweiDisplay,
        icon: {
          iconType: 'ASSET',
          iconValue: GAS_ICONS[gasOption],
        },
      };
    });
    return {
      menuItems: menuOptions,
      menuTitle: '',
    };
  }, [
    currentBlockParams?.baseFeePerGas?.gwei,
    currentNetwork,
    gasFeeParamsBySpeed,
    selectedGasFeeOption,
    speedOptions,
  ]);

  const gasOptionsAvailable = useMemo(() => speedOptions.length > 1, [
    speedOptions.length,
  ]);

  const onDonePress = useCallback(() => {
    if (canGoBack) {
      goBack();
    } else {
      validateGasParams?.current?.(goBack);
    }
  }, [canGoBack, goBack, validateGasParams]);

  const renderGasSpeedPager = useMemo(() => {
    if (showGasOptions) return;
    const label = selectedGasFeeOption ?? NORMAL;
    const pager = (
      <GasSpeedLabelPager
        colorForAsset={
          gasOptionsAvailable
            ? makeColorMoreChill(
                rawColorForAsset || colors.appleBlue,
                colors.shadowBlack
              )
            : colors.alpha(colors.blueGreyDark, 0.12)
        }
        currentNetwork={currentNetwork}
        dropdownEnabled={gasOptionsAvailable}
        label={label}
        showGasOptions={showGasOptions}
        showPager
        theme={theme}
      />
    );
    if (!gasOptionsAvailable || gasIsNotReady) return pager;
    return (
      <ContextMenuButton
        activeOpacity={0}
        enableContextMenu
        isAnchoredToRight
        isMenuPrimaryAction
        menuConfig={menuConfig}
        onPressMenuItem={handlePressMenuItem}
        useActionSheetFallback={false}
        wrapNativeComponent={false}
      >
        {pager}
      </ContextMenuButton>
    );
  }, [
    colors,
    currentNetwork,
    gasIsNotReady,
    gasOptionsAvailable,
    handlePressMenuItem,
    menuConfig,
    rawColorForAsset,
    selectedGasFeeOption,
    showGasOptions,
    theme,
  ]);

  useEffect(() => {
    const gasOptions = speeds || GasSpeedOrder;
    const currentSpeedIndex = gasOptions?.indexOf(selectedGasFeeOption);
    // If the option isn't available anymore, we need to reset it
    // take the first speed or normal by default
    if (currentSpeedIndex === -1) {
      handlePressSpeedOption(gasOptions?.[0] || NORMAL);
    }
  }, [handlePressSpeedOption, speeds, selectedGasFeeOption, isL2]);

  // had to do this hack because calling it directly from `onPress`
  // would make the expanded sheet come up with too much force
  // instead calling it from `useEffect` makes it appear smoothly
  useEffect(() => {
    if (
      shouldOpenCustomGasSheet.shouldOpen &&
      !prevShouldOpenCustomGasSheet.shouldOpen
    ) {
      openCustomGasSheet();
      setShouldOpenCustomGasSheet({ focusTo: null, shouldOpen: false });
    }
  }, [
    openCustomGasSheet,
    prevShouldOpenCustomGasSheet,
    shouldOpenCustomGasSheet.shouldOpen,
  ]);

  return (
    <Container
      horizontalPadding={horizontalPadding}
      marginBottom={marginBottom}
      marginTop={marginTop}
      testID={testID}
    >
      <Row justify="space-between">
        <ButtonPressAnimation
          onPress={openGasHelper}
          scaleTo={0.9}
          testID="estimated-fee-label"
        >
          <Row>
            <NativeCoinIconWrapper>
              <CoinIcon
                address={nativeFeeCurrency.address}
                size={18}
                symbol={nativeFeeCurrency.symbol}
              />
            </NativeCoinIconWrapper>
            <TextContainer>
              <Text>
                <AnimateNumber
                  formatter={formatGasPrice}
                  interval={6}
                  renderContent={renderGasPriceText}
                  steps={6}
                  timing="linear"
                  value={price}
                />
                <Text letterSpacing="one" size="lmedium" weight="heavy">
                  {' '}
                </Text>
                <TransactionTimeLabel
                  formatter={formatTransactionTime}
                  theme={theme}
                  isLongWait={isLongWait}
                />
              </Text>
            </TextContainer>
          </Row>
          <Row justify="space-between">
            <Label
              color={
                theme === 'dark'
                  ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.6)
                  : colors.alpha(colors.blueGreyDark, 0.6)
              }
              size="smedium"
              weight="bold"
            >
              {lang.t('swap.gas.estimated_fee')}{' '}
              <Label
                color={
                  theme === 'dark'
                    ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.25)
                    : colors.alpha(colors.blueGreyDark, 0.25)
                }
                size="smedium"
                weight="bold"
              >
                􀅵
              </Label>
            </Label>
          </Row>
        </ButtonPressAnimation>
        <Centered>
          <GasSpeedPagerCentered testID="gas-speed-pager">
            {renderGasSpeedPager}
          </GasSpeedPagerCentered>

          <Centered>
            {isL2 ? (
              <ChainBadgeContainer>
                <ChainBadge assetType={currentNetwork} position="relative" />
              </ChainBadgeContainer>
            ) : showGasOptions ? (
              <CustomGasButton
                borderColor={makeColorMoreChill(
                  rawColorForAsset || colors.appleBlue,
                  colors.shadowBlack
                )}
                onPress={onDonePress}
                testID="gas-speed-done-button"
              >
                <DoneCustomGas
                  color={
                    theme !== 'light'
                      ? colors.whiteLabel
                      : makeColorMoreChill(
                          rawColorForAsset || colors.appleBlue,
                          colors.shadowBlack
                        )
                  }
                >
                  Done
                </DoneCustomGas>
              </CustomGasButton>
            ) : (
              <CustomGasButton
                borderColor={
                  theme === 'dark'
                    ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.12)
                    : colors.alpha(colors.blueGreyDark, 0.06)
                }
                onPress={openCustomOptions}
                testID="gas-speed-custom"
              >
                <Symbol
                  color={
                    theme === 'dark'
                      ? colors.whiteLabel
                      : colors.alpha(colors.blueGreyDark, 0.8)
                  }
                >
                  􀌆
                </Symbol>
              </CustomGasButton>
            )}
          </Centered>
        </Centered>
      </Row>
    </Container>
  );
};

export default GasSpeedButton;
