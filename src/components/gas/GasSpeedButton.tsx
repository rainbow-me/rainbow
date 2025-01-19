/* eslint-disable no-nested-ternary */
import AnimateNumber from '@bankify/react-native-animate-number';
import lang from 'i18n-js';
import { isEmpty, isNaN, isNil, noop } from 'lodash';
import makeColorMoreChill from 'make-color-more-chill';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Keyboard, View } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { darkModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { Centered, Column, Row } from '../layout';
import { Text } from '../text';
import { GasSpeedLabelPager } from '.';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { isL2Chain } from '@/handlers/web3';
import { add, convertAmountToNativeDisplayWorklet, greaterThan, toFixedDecimals } from '@/helpers/utilities';
import { useAccountSettings, useColorForAsset, useGas, usePrevious } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { fonts, fontWithWidth, margin, padding } from '@/styles';
import { gasUtils } from '@/utils';
import { IS_ANDROID } from '@/env';
import { ContextMenu } from '../context-menu';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ThemeContextProps, useTheme } from '@/theme';
import { ParsedAddressAsset } from '@/entities';
import { GasSpeed } from '@/__swaps__/types/gas';

const { GAS_EMOJIS, GAS_ICONS, GasSpeedOrder, CUSTOM, URGENT, NORMAL, FAST, getGasLabel } = gasUtils;

type WithThemeProps = {
  borderColor: string;
  color: string;
  theme: ThemeContextProps;
  marginBottom: number;
  marginTop: number;
  horizontalPadding: number;
};

const CustomGasButton = styled(ButtonPressAnimation).attrs({
  align: 'center',
  alignItems: 'center',
  hapticType: 'impactHeavy',
  height: 30,
  justifyContent: 'center',
  scaleTo: 0.8,
})({
  borderColor: ({ borderColor, color, theme: { colors } }: WithThemeProps) => borderColor || color || colors.appleBlue,
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

const ChainBadgeContainer = styled(View).attrs({
  hapticType: 'impactHeavy',
  scaleTo: 0.9,
})({
  ...padding.object(0),
  ...margin.object(0),
});

const NativeCoinIconWrapper = styled(Column).attrs({})({
  ...margin.object(1, 5, 0, 0),
  alignItems: 'center',
  height: 18,
  justifyContent: 'center',
  width: 18,
});

const Container = styled(Column).attrs({
  alignItems: 'center',
  hapticType: 'impactHeavy',
  justifyContent: 'center',
})(({ marginBottom, marginTop, horizontalPadding }: WithThemeProps) => ({
  ...margin.object(marginTop, 0, marginBottom),
  ...padding.object(0, horizontalPadding),
  width: '100%',
}));

const Label = styled(Text).attrs(({ size }: { size: string }) => ({
  lineHeight: 'normal',
  size: size || 'lmedium',
}))(({ weight }: { weight: string }) => fontWithWidth(weight || fonts.weight.semibold));

const GasSpeedPagerCentered = styled(Centered).attrs(() => ({
  marginRight: 8,
}))({});

const TextContainer = styled(Column).attrs(() => ({}))({});

const TransactionTimeLabel = ({ formatter, theme }: { formatter: () => string; theme: string }) => {
  const { colors } = useTheme();
  const color = theme === 'dark' ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.6) : colors.alpha(colors.blueGreyDark, 0.6);

  return (
    <Label align="right" color={color} size="lmedium" weight="bold">
      {formatter()}
    </Label>
  );
};

const shouldRoundGasDisplay = (chainId: ChainId) => {
  switch (chainId) {
    case ChainId.bsc:
    case ChainId.polygon:
      return false;
    default:
      return true;
  }
};

type GasSpeedButtonProps = {
  asset?: Partial<ParsedAddressAsset>;
  chainId: ChainId;
  horizontalPadding?: number;
  fallbackColor?: string;
  marginBottom?: number;
  marginTop?: number;
  speeds?: string[];
  testID?: string;
  theme?: string;
  canGoBack?: boolean;
  showGasOptions?: boolean;
  validateGasParams?: React.RefObject<(callback?: () => void) => void>;
  loading?: boolean;
};

const GasSpeedButton = ({
  asset,
  chainId,
  horizontalPadding = 19,
  fallbackColor,
  marginBottom = 20,
  marginTop = 18,
  speeds,
  testID = 'gas-speed-button',
  theme = 'dark',
  canGoBack = true,
  showGasOptions = false,
  validateGasParams = undefined,
  loading = false,
}: GasSpeedButtonProps) => {
  const { colors } = useTheme();
  const { navigate, goBack } = useNavigation();
  const { nativeCurrency } = useAccountSettings();
  const rawColorForAsset = useColorForAsset(asset || {}, fallbackColor, false, true);

  const { gasFeeParamsBySpeed, updateGasFeeOption, selectedGasFee, selectedGasFeeOption, currentBlockParams } = useGas();

  const [gasPriceReady, setGasPriceReady] = useState(false);
  const [shouldOpenCustomGasSheet, setShouldOpenCustomGasSheet] = useState<{
    focusTo: string | null;
    shouldOpen: boolean;
  }>({
    focusTo: null,
    shouldOpen: false,
  });
  const prevShouldOpenCustomGasSheet = usePrevious(shouldOpenCustomGasSheet);

  // Because of the animated number component
  // we need to trim the native currency symbol
  // (and leave the number only!)
  // which gets added later in the formatGasPrice function
  const price = useMemo(() => {
    const gasPrice = selectedGasFee?.gasFee?.estimatedFee?.native?.value?.amount;
    if (isNil(gasPrice)) return null;

    return gasPrice;
  }, [selectedGasFee]);

  const isL2 = useMemo(() => isL2Chain({ chainId }), [chainId]);

  const isLegacyGasNetwork = !selectedGasFee?.gasFee?.maxFee;

  const gasIsNotReady = useMemo(
    () => isNil(price) || isEmpty(gasFeeParamsBySpeed) || isEmpty(selectedGasFee?.gasFee),
    [gasFeeParamsBySpeed, price, selectedGasFee]
  );

  const formatGasPrice = useCallback(
    (animatedValue: string) => {
      if (animatedValue === null || loading || isNaN(animatedValue)) {
        return 0;
      }
      !gasPriceReady && setGasPriceReady(true);
      return convertAmountToNativeDisplayWorklet(animatedValue, nativeCurrency, true);
    },
    [loading, gasPriceReady, nativeCurrency]
  );

  const openCustomOptionsRef = useRef<any>();

  const openCustomGasSheet = useCallback(() => {
    if (gasIsNotReady) return;
    navigate(Routes.CUSTOM_GAS_SHEET, {
      asset,
      fallbackColor,
      focusTo: shouldOpenCustomGasSheet.focusTo,
      openCustomOptions: (focusTo: string) => openCustomOptionsRef?.current?.(focusTo),
      speeds: speeds ?? GasSpeedOrder,
      type: 'custom_gas',
    });
  }, [gasIsNotReady, navigate, asset, shouldOpenCustomGasSheet.focusTo, speeds, fallbackColor]);

  const openCustomOptions = useCallback(
    (focusTo: string) => {
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
    (animatedNumber: number) => {
      const priceText = animatedNumber === 0 || loading ? lang.t('swap.loading') : animatedNumber;
      return (
        <Text
          color={theme === 'dark' ? colors.whiteLabel : colors.alpha(colors.blueGreyDark, 0.8)}
          lineHeight="normal"
          size="lmedium"
          weight="heavy"
        >
          {priceText}
        </Text>
      );
    },
    [loading, theme, colors]
  );

  // I'M SHITTY CODE BUT GOT THINGS DONE REFACTOR ME ASAP
  const handlePressSpeedOption = useCallback(
    (selectedSpeed: string) => {
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

    const estimatedTime = (selectedGasFee?.estimatedTime?.display || '').split(' ');
    const [estimatedTimeValue = '0', estimatedTimeUnit = 'min'] = estimatedTime;
    const time = parseFloat(estimatedTimeValue).toFixed(0);
    if (!estimatedTime) {
      return '';
    }

    if (time === '0') {
      return '< 1 sec';
    }

    const timeSymbol = estimatedTimeUnit === 'hr' ? '>' : '~';
    return `${timeSymbol}${time} ${estimatedTimeUnit}`;
  }, [gasPriceReady, selectedGasFee?.estimatedTime?.display]);

  const openGasHelper = useCallback(async () => {
    Keyboard.dismiss();
    const nativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];
    navigate(Routes.EXPLAIN_SHEET, {
      chainId,
      type: 'gas',
      nativeAsset,
    });
  }, [chainId, navigate]);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: GasSpeed } }) => handlePressSpeedOption(actionKey),
    [handlePressSpeedOption]
  );

  const handlePressActionSheet = useCallback(
    (buttonIndex: number) => {
      switch (buttonIndex) {
        case 0:
          handlePressSpeedOption(NORMAL);
          break;
        case 1:
          handlePressSpeedOption(FAST);
          break;
        case 2:
          handlePressSpeedOption(URGENT);
          break;
        case 3:
          handlePressSpeedOption(CUSTOM);
      }
    },
    [handlePressSpeedOption]
  );

  const speedOptions = useMemo(() => {
    if (speeds) return speeds;
    return useBackendNetworksStore.getState().getChainsGasSpeeds()[chainId];
  }, [chainId, speeds]);

  const menuConfig = useMemo(() => {
    const menuOptions = speedOptions?.map(gasOption => {
      const totalGwei = add(gasFeeParamsBySpeed[gasOption]?.maxBaseFee?.gwei, gasFeeParamsBySpeed[gasOption]?.maxPriorityFeePerGas?.gwei);
      const estimatedGwei = add(currentBlockParams?.baseFeePerGas?.gwei, gasFeeParamsBySpeed[gasOption]?.maxPriorityFeePerGas?.gwei);

      const shouldRoundGwei = shouldRoundGasDisplay(chainId);
      const gweiDisplay = !shouldRoundGwei
        ? // @ts-expect-error - legacy gas params has `gasPrice`
          gasFeeParamsBySpeed[gasOption]?.gasPrice?.display
        : gasOption === 'custom' && selectedGasFeeOption !== 'custom'
          ? ''
          : greaterThan(estimatedGwei, totalGwei)
            ? `${toFixedDecimals(totalGwei, isL2 ? 4 : 0)} Gwei`
            : `${toFixedDecimals(estimatedGwei, isL2 ? 4 : 0)}–${toFixedDecimals(totalGwei, isL2 ? 4 : 0)} Gwei`;
      return {
        actionKey: gasOption,
        actionTitle: (android ? `${GAS_EMOJIS[gasOption]}  ` : '') + getGasLabel(gasOption),
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
  }, [speedOptions, gasFeeParamsBySpeed, currentBlockParams?.baseFeePerGas?.gwei, chainId, selectedGasFeeOption, isL2]);

  const gasOptionsAvailable = useMemo(() => speedOptions?.length > 1, [speedOptions?.length]);

  const onDonePress = useCallback(() => {
    if (canGoBack) {
      goBack();
    } else {
      validateGasParams?.current?.(goBack);
    }
  }, [canGoBack, goBack, validateGasParams]);

  const renderGasSpeedPager = useMemo(() => {
    if (showGasOptions) return;
    const label = getGasLabel(selectedGasFeeOption);
    const pager = (
      <GasSpeedLabelPager
        colorForAsset={
          gasOptionsAvailable
            ? makeColorMoreChill(rawColorForAsset || colors.appleBlue, colors.shadowBlack)
            : colors.alpha(colors.blueGreyDark, 0.12)
        }
        dropdownEnabled={gasOptionsAvailable}
        onPress={noop}
        label={label}
        theme={theme}
      />
    );
    if (!gasOptionsAvailable || gasIsNotReady) return pager;

    if (IS_ANDROID) {
      return (
        <ContextMenu
          activeOpacity={0}
          enableContextMenu
          isAnchoredToRight
          isMenuPrimaryAction
          onPressActionSheet={handlePressActionSheet}
          options={speedOptions}
          useActionSheetFallback={false}
          wrapNativeComponent={false}
        >
          <Centered>{pager}</Centered>
        </ContextMenu>
      );
    }

    return (
      <ContextMenuButton
        enableContextMenu
        isAnchoredToRight
        isMenuPrimaryAction
        menuConfig={menuConfig}
        onPressMenuItem={handlePressMenuItem}
        useActionSheetFallback={false}
      >
        {pager}
      </ContextMenuButton>
    );
  }, [
    colors,
    gasIsNotReady,
    gasOptionsAvailable,
    handlePressActionSheet,
    handlePressMenuItem,
    menuConfig,
    speedOptions,
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
    if (shouldOpenCustomGasSheet.shouldOpen && !prevShouldOpenCustomGasSheet?.shouldOpen) {
      openCustomGasSheet();
      setShouldOpenCustomGasSheet({ focusTo: null, shouldOpen: false });
    }
  }, [openCustomGasSheet, prevShouldOpenCustomGasSheet, shouldOpenCustomGasSheet.shouldOpen]);

  return (
    <Container horizontalPadding={horizontalPadding} marginBottom={marginBottom} marginTop={marginTop} testID={testID}>
      <Row justify="space-between">
        <ButtonPressAnimation onPress={openGasHelper} scaleTo={0.9} testID="estimated-fee-label" disallowInterruption={false}>
          <Row>
            <NativeCoinIconWrapper>
              <AnimatePresence>
                {!!chainId && (
                  <MotiView
                    animate={{ opacity: 1 }}
                    from={{ opacity: 0 }}
                    // @ts-expect-error - MotiTransitionProp is not assignable to TransitionConfig
                    transition={{
                      duration: 300,
                      easing: Easing.bezier(0.2, 0, 0, 1),
                      type: 'timing',
                    }}
                  >
                    <ChainImage chainId={chainId} position="relative" size={16} />
                  </MotiView>
                )}
              </AnimatePresence>
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
                <TransactionTimeLabel formatter={formatTransactionTime} theme={theme} />
              </Text>
            </TextContainer>
          </Row>
          <Row justify="space-between">
            <Label
              color={theme === 'dark' ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.6) : colors.alpha(colors.blueGreyDark, 0.6)}
              size="smedium"
              weight="bold"
            >
              {lang.t('swap.gas.estimated_fee')}{' '}
              <Label
                color={theme === 'dark' ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.25) : colors.alpha(colors.blueGreyDark, 0.25)}
                size="smedium"
                weight="bold"
              >
                􀅵
              </Label>
            </Label>
          </Row>
        </ButtonPressAnimation>
        <Centered>
          <GasSpeedPagerCentered testID="gas-speed-pager">{renderGasSpeedPager}</GasSpeedPagerCentered>

          <Centered>
            {isLegacyGasNetwork ? (
              <ChainBadgeContainer>
                <ChainImage chainId={chainId} position="relative" size={16} />
              </ChainBadgeContainer>
            ) : showGasOptions ? (
              <CustomGasButton
                borderColor={makeColorMoreChill(rawColorForAsset || colors.appleBlue, colors.shadowBlack)}
                onPress={onDonePress}
                testID="gas-speed-done-button"
              >
                <DoneCustomGas
                  color={
                    theme !== 'light' ? colors.whiteLabel : makeColorMoreChill(rawColorForAsset || colors.appleBlue, colors.shadowBlack)
                  }
                >
                  {lang.t('button.done')}
                </DoneCustomGas>
              </CustomGasButton>
            ) : (
              <CustomGasButton
                borderColor={
                  theme === 'dark' ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.12) : colors.alpha(colors.blueGreyDark, 0.06)
                }
                onPress={openCustomOptions}
                testID="gas-speed-custom"
              >
                <Symbol color={theme === 'dark' ? colors.whiteLabel : colors.alpha(colors.blueGreyDark, 0.8)}>􀌆</Symbol>
              </CustomGasButton>
            )}
          </Centered>
        </Centered>
      </Row>
    </Container>
  );
};

export default GasSpeedButton;
