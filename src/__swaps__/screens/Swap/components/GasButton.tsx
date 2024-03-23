import React, { useMemo, useState, useCallback, useRef } from 'react';
import { InteractionManager, Keyboard } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import { Inline, Stack, Text, TextIcon } from '@/design-system';
import { gasStore } from '@/state/gas/gasStore';
import { Centered } from '@/components/layout';
import { useTheme } from '@/theme';
import { IS_ANDROID } from '@/env';
import { GasSpeedLabelPager } from '@/components/gas';
import makeColorMoreChill from 'make-color-more-chill';
import { getNetworkObj } from '@/networks';
import { useRoute } from '@react-navigation/native';
import { useAccountSettings, useColorForAsset } from '@/hooks';
import { ContextMenu } from '@/components/context-menu';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { isNil, isEmpty } from 'lodash';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { gasUtils } from '@/utils';
import styled from '@/styled-thing';
import { useMeteorology } from '@/__swaps__/utils/meteorology';
import { parseGasFeeParamsBySpeed } from '@/__swaps__/utils/gasUtils';
const { GasSpeedOrder, CUSTOM, URGENT, NORMAL, FAST, GAS_ICONS, GAS_EMOJIS } = gasUtils;

const mockedGasLimit = 21000;
const mockedNativeAsset = { address: '0x0000000000000000000000000000000000000000', chainId: 1, decimals: 18, symbol: 'ETH' };

export const GasButton = ({ accentColor }: { accentColor?: string }) => {
  const { selectedGas } = gasStore.getState();
  const [showGasOptions, setShowGasOptions] = useState(false);
  return (
    <ButtonPressAnimation onPress={() => setShowGasOptions(!showGasOptions)}>
      <GasMenu>
        <Stack space="12px">
          <Inline alignVertical="center" space={{ custom: 5 }}>
            <Inline alignVertical="center" space="4px">
              <TextIcon
                color={accentColor ? { custom: accentColor } : 'red'}
                height={10}
                size="icon 12px"
                textStyle={{ marginTop: -1.5 }}
                width={16}
                weight="bold"
              >
                􀙭
              </TextIcon>
              <Text color="label" size="15pt" weight="heavy">
                {selectedGas?.display}
              </Text>
            </Inline>
            <TextIcon color="labelSecondary" height={10} size="icon 13px" weight="bold" width={12}>
              􀆏
            </TextIcon>
          </Inline>
          <Inline alignVertical="center" space="4px">
            <TextIcon color="labelQuaternary" height={10} size="icon 11px" weight="heavy" width={16}>
              􀵟
            </TextIcon>
            <Text color="labelTertiary" size="15pt" weight="bold">
              {selectedGas?.gasFee?.display}
            </Text>
          </Inline>
        </Stack>
      </GasMenu>
    </ButtonPressAnimation>
  );
};
const GasSpeedPagerCentered = styled(Centered).attrs(() => ({
  marginRight: 8,
}))({});

const GasMenu = ({ showGasOptions, flashbotTransaction, children }) => {
  const theme = useTheme();
  const { colors } = theme;
  const { navigate } = useNavigation();
  const { nativeCurrencySymbol, nativeCurrency } = useAccountSettings();
  const { selectedGas, gasFeeParamsBySpeed, setGasFeeParamsBySpeed, setSelectedGas } = gasStore.getState();
  const { params } = useRoute();
  const { currentNetwork, asset, fallbackColor } = params || {};
  const chainId = getNetworkObj(currentNetwork).id;
  const speedOptions = useMemo(() => {
    return getNetworkObj(currentNetwork).gas.speeds;
  }, [currentNetwork]);
  const gasOptionsAvailable = useMemo(() => speedOptions.length > 1, [speedOptions.length]);
  const rawColorForAsset = useColorForAsset(asset || {}, fallbackColor, false, true);
  const [shouldOpenCustomGasSheet, setShouldOpenCustomGasSheet] = useState({
    focusTo: null,
    shouldOpen: false,
  });

  const { data, isLoading } = useMeteorology({ chainId });
  let gasFeeBySpeed = {};
  if (!isLoading)
    gasFeeBySpeed = parseGasFeeParamsBySpeed({ chainId, data, gasLimit: mockedGasLimit, nativeAsset: mockedNativeAsset, currency: 'USD' });
  const price = useMemo(() => {
    const gasPrice = selectedGas?.gasFee?.display;
    if (isNil(gasPrice)) return null;
    return gasPrice
      .replace(',', '') // In case gas price is > 1k!
      .replace(nativeCurrencySymbol, '')
      .trim();
  }, [nativeCurrencySymbol, selectedGas]);

  const gasIsNotReady = useMemo(
    () => isNil(price) || isEmpty(gasFeeParamsBySpeed) || isEmpty(selectedGas?.gasFee),
    [gasFeeParamsBySpeed, price, selectedGas]
  );
  const openCustomOptionsRef = useRef();

  const openCustomGasSheet = useCallback(() => {
    if (gasIsNotReady && !__DEV__) return;
    navigate(Routes.CUSTOM_GAS_SHEET, {
      asset,
      fallbackColor,
      flashbotTransaction,
      focusTo: shouldOpenCustomGasSheet.focusTo,
      openCustomOptions: focusTo => openCustomOptionsRef?.current?.(focusTo),
      speeds: GasSpeedOrder,
      type: 'custom_gas',
    });
  }, [gasIsNotReady, navigate, asset, shouldOpenCustomGasSheet.focusTo, flashbotTransaction, fallbackColor]);
  const handlePressSpeedOption = useCallback(
    gasFeeParamsBySpeed => {
      if (gasFeeParamsBySpeed === CUSTOM) {
        if (ios) {
          InteractionManager.runAfterInteractions(() => {
            setShouldOpenCustomGasSheet({
              focusTo: null,
              shouldOpen: true,
            });
            openCustomGasSheet();
          });
        } else {
          openCustomGasSheet();
          setTimeout(() => setGasFeeParamsBySpeed({ gasFeeParamsBySpeed }), 500);
          return;
        }
      }
      setGasFeeParamsBySpeed({ gasFeeParamsBySpeed });
      // todo - replace with actual gas
      const gasFee = { amount: '0', display: '0', gwei: 1 };
      setSelectedGas({ maxBaseFee: gasFee, option: gasFeeParamsBySpeed, estimatedTime: { amount: 0, display: '10s' } });
    },
    [setGasFeeParamsBySpeed, openCustomGasSheet]
  );
  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      handlePressSpeedOption(actionKey);
    },
    [handlePressSpeedOption]
  );

  const handlePressActionSheet = useCallback(
    buttonIndex => {
      switch (buttonIndex) {
        case 0:
          setGasFeeParamsBySpeed(NORMAL);
          break;
        case 1:
          setGasFeeParamsBySpeed(FAST);
          break;
        case 2:
          setGasFeeParamsBySpeed(URGENT);
          break;
        case 3:
          setGasFeeParamsBySpeed(CUSTOM);
      }
    },
    [setGasFeeParamsBySpeed]
  );

  const menuConfig = useMemo(() => {
    const menuOptions = speedOptions.map(gasOption => {
      if (IS_ANDROID) return gasOption;
      const totalGwei = selectedGas?.gasFee?.amount;
      const gweiDisplay = totalGwei;

      // const totalGwei = add(gasFeeParamsBySpeed[gasOption]?.maxBaseFee?.gwei, gasFeeParamsBySpeed[gasOption]?.maxPriorityFeePerGas?.gwei);
      // const estimatedGwei = add(currentBlockParams?.baseFeePerGas?.gwei, gasFeeParamsBySpeed[gasOption]?.maxPriorityFeePerGas?.gwei);

      // const shouldRoundGwei = getNetworkObj(currentNetwork).gas.roundGasDisplay;
      // const gweiDisplay = !shouldRoundGwei
      //   ? gasFeeParamsBySpeed[gasOption]?.gasPrice?.display
      //   : gasOption === 'custom' && selectedGasFeeOption !== 'custom'
      //     ? ''
      //     : greaterThan(estimatedGwei, totalGwei)
      //       ? `${toFixedDecimals(totalGwei, isL2 ? 4 : 0)} Gwei`
      //       : `${toFixedDecimals(estimatedGwei, isL2 ? 4 : 0)}–${toFixedDecimals(totalGwei, isL2 ? 4 : 0)} Gwei`;
      return {
        actionKey: gasOption,
        actionTitle: android ? `${GAS_EMOJIS[gasOption]}  ` : gasOption, //+ getGasLabel(gasOption),
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
  }, [selectedGas]);
  // }, [currentBlockParams?.baseFeePerGas?.gwei, currentNetwork, gasFeeParamsBySpeed, selectedGasFeeOption, speedOptions, isL2]);
  const renderGasSpeedPager = useMemo(() => {
    if (showGasOptions) return;
    const pager = (
      <GasSpeedLabelPager
        colorForAsset={
          gasOptionsAvailable
            ? makeColorMoreChill(rawColorForAsset || colors.appleBlue, colors.shadowBlack)
            : colors.alpha(colors.blueGreyDark, 0.12)
        }
        currentNetwork={currentNetwork}
        dropdownEnabled={gasOptionsAvailable}
        label={selectedGas?.display}
        showGasOptions={showGasOptions}
        showPager
        theme={theme}
      />
    );
    if (!gasOptionsAvailable || (gasIsNotReady && false)) return pager;

    if (IS_ANDROID) {
      return (
        <ContextMenu
          activeOpacity={0}
          enableContextMenu
          isAnchoredToRight
          isMenuPrimaryAction
          onPressActionSheet={handlePressActionSheet}
          options={menuConfig.menuItems}
          useActionSheetFallback={false}
          wrapNativeComponent={false}
        >
          <Centered>{children}</Centered>
        </ContextMenu>
      );
    }

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
        {children}
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
    showGasOptions,
    theme,
  ]);
  return <GasSpeedPagerCentered testID="gas-speed-pager">{renderGasSpeedPager}</GasSpeedPagerCentered>;
};
