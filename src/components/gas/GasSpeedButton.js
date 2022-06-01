import AnimateNumber from '@bankify/react-native-animate-number';
import lang from 'i18n-js';
import { isEmpty, isNaN, isNil, lowerCase, upperFirst } from 'lodash';
import makeColorMoreChill from 'make-color-more-chill';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager, Keyboard } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import { darkModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { ChainBadge, CoinIcon } from '../coin-icon';
import { Centered, Column, Row } from '../layout';
import { Text } from '../text';
import { GasSpeedLabelPager } from '.';
import { isL2Network } from '@rainbow-me/handlers/web3';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  add,
  greaterThan,
  toFixedDecimals,
} from '@rainbow-me/helpers/utilities';
import {
  useAccountSettings,
  useColorForAsset,
  useGas,
  usePrevious,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { ETH_ADDRESS, MATIC_MAINNET_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { fonts, fontWithWidth, margin, padding } from '@rainbow-me/styles';
import { gasUtils, showActionSheetWithOptions } from '@rainbow-me/utils';

const { GAS_ICONS, GasSpeedOrder, CUSTOM, URGENT, NORMAL, FAST } = gasUtils;

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
})(({ marginBottom, horizontalPadding }) => ({
  ...margin.object(18, 0, marginBottom),
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
  asset,
  bottom = 0,
  currentNetwork,
  horizontalPadding = 19,
  marginBottom = 20,
  speeds = null,
  showGasOptions = false,
  testID,
  theme = 'dark',
  canGoBack = true,
  validateGasParams,
}) => {
  const { colors } = useTheme();
  const { navigate, goBack } = useNavigation();
  const { nativeCurrencySymbol, nativeCurrency } = useAccountSettings();
  const rawColorForAsset = useColorForAsset(asset || {}, null, false, true);

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
    if (!gasPriceReady) return '';
    const estimatedTime = (selectedGasFee?.estimatedTime?.display || '').split(
      ' '
    );
    const [estimatedTimeValue = 0, estimatedTimeUnit = 'min'] = estimatedTime;
    const time = parseFloat(estimatedTimeValue).toFixed(0);

    let timeSymbol = estimatedTimeUnit === 'hr' ? '>' : '~';
    if (time === '0' && estimatedTimeUnit === 'min') {
      return '';
    }
    return `${timeSymbol}${time} ${estimatedTimeUnit}`;
  }, [gasPriceReady, selectedGasFee?.estimatedTime?.display]);

  const openGasHelper = useCallback(() => {
    android && Keyboard.dismiss();
    const network = currentNetwork ?? networkTypes.mainnet;
    const networkName = networkInfo[network].name;
    navigate(Routes.EXPLAIN_SHEET, { network: networkName, type: 'gas' });
  }, [currentNetwork, navigate]);

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
        return [NORMAL];
      default:
        return GasSpeedOrder;
    }
  }, [currentNetwork, speeds]);

  const menuConfig = useMemo(() => {
    const menuOptions = speedOptions.map(gasOption => {
      const totalGwei = add(
        gasFeeParamsBySpeed[gasOption]?.maxFeePerGas?.gwei,
        gasFeeParamsBySpeed[gasOption]?.maxPriorityFeePerGas?.gwei
      );
      const estimatedGwei = add(
        currentBlockParams?.baseFeePerGas?.gwei,
        gasFeeParamsBySpeed[gasOption]?.maxPriorityFeePerGas?.gwei
      );
      const gweiDisplay =
        currentNetwork === networkTypes.polygon
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
        actionTitle: upperFirst(gasOption),
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
    speedOptions,
  ]);

  const onDonePress = useCallback(() => {
    if (canGoBack) {
      goBack();
    } else {
      validateGasParams?.current?.(goBack);
    }
  }, [canGoBack, goBack, validateGasParams]);

  const onPressAndroid = useCallback(() => {
    if (gasIsNotReady) return;
    const uppercasedSpeedOptions = speedOptions.map(speed => upperFirst(speed));
    const androidContractActions = [...uppercasedSpeedOptions];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: androidContractActions.length,
        options: androidContractActions,
        showSeparators: true,
        title: '',
      },
      buttonIndex => {
        handlePressSpeedOption(lowerCase(androidContractActions[buttonIndex]));
      }
    );
  }, [gasIsNotReady, handlePressSpeedOption, speedOptions]);

  const renderGasSpeedPager = useMemo(() => {
    if (showGasOptions) return;
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
        label={selectedGasFeeOption ?? NORMAL}
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
        menuConfig={menuConfig}
        {...(android ? { onPress: onPressAndroid } : {})}
        isMenuPrimaryAction
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
    onPressAndroid,
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
      bottom={bottom}
      horizontalPadding={horizontalPadding}
      marginBottom={marginBottom}
      testID={testID}
    >
      <Row justify="space-between">
        <ButtonPressAnimation
          onPress={openGasHelper}
          scaleTo={0.9}
          testID="estimated-fee-label"
        >
          <Row style={{ top: android ? 8 : 0 }}>
            <NativeCoinIconWrapper>
              <CoinIcon
                address={nativeFeeCurrency.address}
                size={18}
                symbol={nativeFeeCurrency.symbol}
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
              <Text letterSpacing="one" size="lmedium" weight="heavy">
                {' '}
              </Text>
            </Column>
            <Column>
              <TransactionTimeLabel
                formatter={formatTransactionTime}
                theme={theme}
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
                  {lang.t('button.done')}
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
