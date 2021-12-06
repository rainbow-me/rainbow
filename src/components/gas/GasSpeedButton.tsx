// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@ban... Remove this comment to see the full error message
import AnimateNumber from '@bankify/react-native-animate-number';
import { isEmpty, isNil, lowerCase, upperFirst } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { ContextMenuButton } from 'react-native-ios-context-menu';
import styled from 'styled-components';
import { darkModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { ChainBadge, CoinIcon } from '../coin-icon';
import { Centered, Column, Row } from '../layout';
import { Text } from '../text';
import { GasSpeedLabelPager } from '.';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { isL2Network } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { add, toFixedDecimals } from '@rainbow-me/helpers/utilities';
import {
  useAccountSettings,
  useColorForAsset,
  useGas,
  usePrevious,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ETH_ADDRESS, MATIC_MAINNET_ADDRESS } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, fontWithWidth, margin, padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { gasUtils, showActionSheetWithOptions } from '@rainbow-me/utils';

const { GAS_ICONS, GasSpeedOrder, CUSTOM, URGENT, NORMAL, FAST } = gasUtils;

const CustomGasButton = styled(ButtonPressAnimation).attrs({
  alignItems: 'center',
  hapticType: 'impactHeavy',
  height: 30,
  justifyContent: 'center',
  scaleTo: 0.9,
})`
  border-radius: 19;
  border: ${({ borderColor, color, theme: { colors } }) =>
    `2px solid ${borderColor || color || colors.appleBlue}`};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${padding(android ? 2 : 3, 0)}
`;

const Symbol = styled(Text).attrs({
  alignItems: 'center',
  lineHeight: 'normal',
  size: 'lmedium',
  weight: 'heavy',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${padding(android ? 1 : 0, 6, 0, 7)};
`;

const DoneCustomGas = styled(Text).attrs({
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 'normal',
  size: 'lmedium',
  weight: 'heavy',
})`
  ${padding(0, 0, 0, 0)}
  ${margin(0, 10, 0, 10)}
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const ChainBadgeContainer = styled.View.attrs({
  hapticType: 'impactHeavy',
  scaleTo: 0.9,
})`
  ${padding(0, 0)};
  ${margin(0, 0, 0, 8)};
`;

const NativeCoinIconWrapper = styled(Column)`
  ${margin(1.5, 5, 0, 0)};
`;

const Container = styled(Column).attrs({
  alignItems: 'center',
  hapticType: 'impactHeavy',
  justifyContent: 'center',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${margin(android ? 8 : 19, 0)};
  ${({ horizontalPadding }) => padding(0, horizontalPadding)};
  width: 100%;
`;

const Label = styled(Text).attrs(({ size }) => ({
  lineHeight: 'normal',
  size: size || 'lmedium',
}))`
  ${({ weight }) => fontWithWidth(weight || fonts.weight.semibold)}
`;

const GasSpeedPagerCentered = styled(Centered).attrs(() => ({
  marginRight: 8,
}))``;

const TransactionTimeLabel = ({ formatter, theme }: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
  currentNetwork,
  horizontalPadding = 20,
  speeds = null,
  showGasOptions = false,
  testID,
  theme = 'dark',
}: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const { navigate, goBack } = useNavigation();
  const { nativeCurrencySymbol, nativeCurrency } = useAccountSettings();
  const colorForAsset = useColorForAsset(asset || {}, null, false, true);

  const {
    gasFeeParamsBySpeed,
    gasFeesBySpeed,
    isSufficientGas,
    updateGasFeeOption,
    selectedGasFee,
    selectedGasFeeOption,
    updateToCustomGasFee,
  } = useGas();

  const [estimatedTimeValue, setEstimatedTimeValue] = useState(0);
  const [estimatedTimeUnit, setEstimatedTimeUnit] = useState('min');
  const [shouldOpenCustomGasSheet, setShouldOpenCustomGasSheet] = useState(
    false
  );
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
      isEmpty(selectedGasFee?.gasFee) ||
      isSufficientGas === null,
    [gasFeeParamsBySpeed, isSufficientGas, price, selectedGasFee]
  );

  const formatGasPrice = useCallback(
    animatedValue => {
      if (animatedValue === null) {
        return 0;
      }
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

  const openCustomGasSheet = useCallback(() => {
    if (gasIsNotReady) return;
    navigate(Routes.CUSTOM_GAS_SHEET, {
      asset,
      speeds: speeds ?? GasSpeedOrder,
      type: 'custom_gas',
    });
  }, [gasIsNotReady, navigate, asset, speeds]);

  const openCustomOptions = useCallback(() => {
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android && Keyboard.dismiss();
    setShouldOpenCustomGasSheet(true);
  }, [setShouldOpenCustomGasSheet]);

  const renderGasPriceText = useCallback(
    animatedNumber => {
      const priceText = animatedNumber === 0 ? 'Loading...' : animatedNumber;
      return (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Text
          color={
            theme === 'dark'
              ? colors.whiteLabel
              : colors.alpha(colors.blueGreyDark, 0.8)
          }
          letterSpacing="roundedTight"
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

  const handlePressSpeedOption = useCallback(
    selectedSpeed => {
      if (selectedSpeed === CUSTOM) {
        openCustomGasSheet();
        if (isEmpty(gasFeeParamsBySpeed[CUSTOM])) {
          const gasFeeParams = gasFeeParamsBySpeed[URGENT];
          updateToCustomGasFee({
            ...gasFeeParams,
            option: CUSTOM,
          });
        }
      } else {
        updateGasFeeOption(selectedSpeed);
      }
    },
    [
      openCustomGasSheet,
      gasFeeParamsBySpeed,
      updateToCustomGasFee,
      updateGasFeeOption,
    ]
  );

  const formatTransactionTime = useCallback(() => {
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
    const time = parseFloat(estimatedTimeValue || 0).toFixed(0);
    let timeSymbol = '~';

    if (selectedGasFeeOption === CUSTOM) {
      const customWei = gasFeesBySpeed?.[CUSTOM]?.estimatedFee?.value?.amount;
      if (customWei) {
        const normalWei = gasFeesBySpeed?.[NORMAL]?.estimatedFee?.value?.amount;
        const urgentWei = gasFeesBySpeed?.[URGENT]?.estimatedFee?.value?.amount;
        const minGasPriceSlow = normalWei | urgentWei;
        const maxGasPriceFast = urgentWei;
        if (normalWei < minGasPriceSlow) {
          timeSymbol = '>';
        } else if (normalWei > maxGasPriceFast) {
          timeSymbol = '<';
        }

        return ` ${timeSymbol}${time} ${estimatedTimeUnit}`;
      } else {
        return '';
      }
    }

    if (time === '0' && estimatedTimeUnit === 'min') {
      return '';
    }

    return ` ${timeSymbol}${time} ${estimatedTimeUnit}`;
  }, [
    estimatedTimeUnit,
    estimatedTimeValue,
    gasFeesBySpeed,
    selectedGasFeeOption,
  ]);

  const openGasHelper = useCallback(() => {
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android && Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, { type: 'gas' });
  }, [navigate]);

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
        return [FAST];
      default:
        return GasSpeedOrder;
    }
  }, [currentNetwork, speeds]);

  const menuConfig = useMemo(() => {
    const menuOptions = speedOptions.map((gasOption: any) => ({
      actionKey: gasOption,
      actionTitle: upperFirst(gasOption),

      icon: {
        iconType: 'ASSET',
        iconValue: GAS_ICONS[gasOption],
      },
    }));
    return {
      menuItems: menuOptions,
      menuTitle: '',
    };
  }, [currentNetwork, gasFeeParamsBySpeed, speedOptions]);

  const gasOptionsAvailable = useMemo(() => speedOptions.length > 1, [
    speedOptions,
  ]);

  const defaultSelectedGasFeeOption = useMemo(() => {
    const fastByDefault =
      currentNetwork === networkTypes.arbitrum ||
      currentNetwork === networkTypes.optimism;
    return fastByDefault ? FAST : NORMAL;
  }, [currentNetwork]);

  const onDonePress = useCallback(() => {
    goBack();
  }, [goBack]);

  const onPressAndroid = useCallback(() => {
    if (gasIsNotReady) return;
    const uppercasedSpeedOptions = speedOptions.map((speed: any) =>
      upperFirst(speed)
    );
    const androidContractActions = [...uppercasedSpeedOptions];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: androidContractActions.length,
        options: androidContractActions,
        showSeparators: true,
        title: '',
      },
      (buttonIndex: any) => {
        handlePressSpeedOption(lowerCase(androidContractActions[buttonIndex]));
      }
    );
  }, [gasIsNotReady, handlePressSpeedOption, speedOptions]);

  const renderGasSpeedPager = useMemo(() => {
    if (showGasOptions) return;
    const pager = (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <GasSpeedLabelPager
        colorForAsset={
          gasOptionsAvailable
            ? colorForAsset
            : colors.alpha(colors.blueGreyDark, 0.4)
        }
        currentNetwork={currentNetwork}
        dropdownEnabled={gasOptionsAvailable}
        label={selectedGasFeeOption ?? defaultSelectedGasFeeOption}
        showGasOptions={showGasOptions}
        showPager
        theme={theme}
      />
    );
    if (!gasOptionsAvailable || gasIsNotReady) return pager;
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ContextMenuButton
        activeOpacity={0}
        enableContextMenu
        menuConfig={menuConfig}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
    colorForAsset,
    colors,
    currentNetwork,
    defaultSelectedGasFeeOption,
    gasIsNotReady,
    gasOptionsAvailable,
    handlePressMenuItem,
    menuConfig,
    onPressAndroid,
    selectedGasFeeOption,
    showGasOptions,
    theme,
  ]);

  useEffect(() => {
    const gasOptions = speeds || GasSpeedOrder;
    const currentSpeedIndex = gasOptions?.indexOf(selectedGasFeeOption);
    // If the option isn't available anymore, we need to reset it
    if (currentSpeedIndex === -1) {
      handlePressSpeedOption(defaultSelectedGasFeeOption);
    }
  }, [
    handlePressSpeedOption,
    speeds,
    selectedGasFeeOption,
    isL2,
    defaultSelectedGasFeeOption,
  ]);

  // had to do this hack because calling it directly from `onPress`
  // would make the expanded sheet come up with too much force
  // instead calling it from `useEffect` makes it appear smoothly
  useEffect(() => {
    if (shouldOpenCustomGasSheet && !prevShouldOpenCustomGasSheet) {
      openCustomGasSheet();
      setShouldOpenCustomGasSheet(false);
    }
  }, [
    openCustomGasSheet,
    prevShouldOpenCustomGasSheet,
    shouldOpenCustomGasSheet,
  ]);

  useEffect(() => {
    const estimatedTime = (selectedGasFee?.estimatedTime?.display || '').split(
      ' '
    );

    setEstimatedTimeValue(estimatedTime[0] || 0);
    setEstimatedTimeUnit(estimatedTime[1] || 'min');
  }, [selectedGasFee, selectedGasFeeOption]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container horizontalPadding={horizontalPadding} testID={testID}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row justify="space-between">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ButtonPressAnimation
          onPress={openGasHelper}
          scaleTo={0.9}
          testID="estimated-fee-label"
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Row>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <NativeCoinIconWrapper>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <CoinIcon
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'address' does not exist on type '{ mainn... Remove this comment to see the full error message
                address={nativeFeeCurrency.address}
                size={18}
                symbol={nativeFeeCurrency.symbol}
              />
            </NativeCoinIconWrapper>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <AnimateNumber
                formatter={formatGasPrice}
                interval={6}
                renderContent={renderGasPriceText}
                steps={6}
                timing="linear"
                value={price}
              />
            </Column>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Column>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TransactionTimeLabel
                formatter={formatTransactionTime}
                theme={theme}
              />
            </Column>
          </Row>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Row justify="space-between">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Label
              color={
                theme === 'dark'
                  ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.6)
                  : colors.alpha(colors.blueGreyDark, 0.6)
              }
              size="smedium"
              weight="bold"
            >
              Estimated fee // @ts-expect-error ts-migrate(17004) FIXME: Cannot
              use JSX unless the '--jsx' flag is provided... Remove this comment
              to see the full error message
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
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <GasSpeedPagerCentered testID="gas-speed-pager">
            {renderGasSpeedPager}
          </GasSpeedPagerCentered>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Centered>
            {isL2 ? (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <ChainBadgeContainer>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <ChainBadge assetType={currentNetwork} position="relative" />
              </ChainBadgeContainer>
            ) : showGasOptions ? (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CustomGasButton
                borderColor={colorForAsset}
                onPress={onDonePress}
              >
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <DoneCustomGas
                  color={
                    theme !== 'light'
                      ? colors.whiteLabel
                      : colors.alpha(colors.blueGreyDark, 0.8)
                  }
                >
                  Done
                </DoneCustomGas>
              </CustomGasButton>
            ) : (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CustomGasButton
                borderColor={
                  theme === 'dark'
                    ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.15)
                    : colors.alpha(colors.blueGreyDark, 0.15)
                }
                onPress={openCustomOptions}
                testID="gas-speed-custom"
              >
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
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
