/* eslint-disable no-nested-ternary */
/* @ts-expect-error - no declaration file */
import AnimateNumber from '@bankify/react-native-animate-number';
import * as lang from '@/languages';
import { isEmpty, isNaN, isNil } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, { runOnUI, useAnimatedStyle } from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { Centered } from '@/components/layout';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { isL2Network } from '@/handlers/web3';
import { add, greaterThan, toFixedDecimals } from '@/helpers/utilities';
import { useAccountSettings, useGas, usePrevious } from '@/hooks';
import { ethereumUtils, gasUtils } from '@/utils';
import { getNetworkObj } from '@/networks';
import { IS_ANDROID } from '@/env';
import { ContextMenu } from '@/components/context-menu';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { useSyncSharedValue } from '@/hooks/useSyncSharedValue';
import { useSwapContext } from '../providers/swap-provider';
import { OnPressMenuItemEventObject } from 'react-native-ios-context-menu';
import { Text, Box, Inline, Stack, TextIcon, useForegroundColor } from '@/design-system';
import { THICK_BORDER_WIDTH } from '../constants';
import { ChainId } from '@/__swaps__/types/chains';
import { GasSpeed } from '@/__swaps__/types/gas';
import { InteractionManager, StyleSheet } from 'react-native';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';

const { GAS_EMOJIS, GAS_ICONS, CUSTOM, getGasLabel } = gasUtils;

export const GasButton = ({ isReviewing = false, loading = false }) => {
  const separatatorSecondary = useForegroundColor('separatorSecondary');

  const { selectedGasFee, gasFeeParamsBySpeed, startPollingGasFees, stopPollingGasFees, updateDefaultGasLimit, updateTxFee } = useGas();
  const { SwapInputController, SwapNavigation } = useSwapContext();
  const { nativeCurrencySymbol, nativeCurrency } = useAccountSettings();

  const [flashbots, setFlasbots] = useState<boolean>(false);
  const [asset, setAsset] = useState<ParsedSearchAsset | null>(null);
  const [chainId, setChainId] = useState<ChainId>(ChainId.mainnet);
  const [quote, setQuote] = useState<Quote | CrosschainQuote | QuoteError | null>(null);

  useSyncSharedValue({
    setState: setQuote,
    state: quote,
    sharedValue: SwapInputController.quote,
    syncDirection: 'sharedToState',
  });

  useSyncSharedValue({
    setState: setFlasbots,
    state: flashbots,
    sharedValue: SwapInputController.flashbots,
    syncDirection: 'sharedToState',
  });

  // NOTE: keep this local state in sync with asset to buy
  useSyncSharedValue<ParsedSearchAsset | null, 'sharedToState'>({
    setState: setAsset,
    state: asset,
    syncDirection: 'sharedToState',
    sharedValue: SwapInputController.assetToBuy,
  });

  const prevAsset = usePrevious(asset);
  const prevGasFeesParamsBySpeed = usePrevious(gasFeeParamsBySpeed);
  // const prevTxNetwork = usePrevious(txNetwork);

  // const updateGasLimit = useCallback(async () => {
  //   // TODO: recalculate gas limit when quote changes
  //   // try {
  //   //   const currentNetwork = ethereumUtils.getNetworkFromChainId(chainId);
  //   //   const provider = await getProviderForNetwork(currentNetwork);
  //   //   const swapParams: SwapActionParameters | CrosschainSwapActionParameters = {
  //   //     chainId,
  //   //     inputAmount: inputAmount!,
  //   //     outputAmount: outputAmount!,
  //   //     provider,
  //   //     tradeDetails: tradeDetails!,
  //   //   };
  //   //   const rapType = getSwapRapTypeByExchangeType(isCrosschainSwap);
  //   //   const gasLimit = await getSwapRapEstimationByType(rapType, swapParams);
  //   //   if (gasLimit) {
  //   //     if (getNetworkObj(currentNetwork).gas?.OptimismTxFee) {
  //   //       if (tradeDetails) {
  //   //         const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(
  //   //           // @ts-ignore
  //   //           {
  //   //             data: quote.data,
  //   //             from: quote.from,
  //   //             to: quote.to ?? null,
  //   //             value: quote.value,
  //   //           },
  //   //           provider
  //   //         );
  //   //         updateTxFee(gasLimit, null, l1GasFeeOptimism);
  //   //       } else {
  //   //         updateTxFee(gasLimit, null, ethUnits.default_l1_gas_fee_optimism_swap);
  //   //       }
  //   //     } else {
  //   //       updateTxFee(gasLimit, null);
  //   //     }
  //   //   }
  //   // } catch (error) {
  //   //   updateTxFee(ethereumUtils.getBasicSwapGasLimit(chainId), null);
  //   // }
  // }, []);

  // useEffect(() => {
  //   if (
  //     !isGasReady ||
  //     (!prevTxNetwork && txNetwork !== prevTxNetwork) ||
  //     (!isEmpty(gasFeeParamsBySpeed) && !isEqual(gasFeeParamsBySpeed, prevGasFeesParamsBySpeed))
  //   ) {
  //     updateGasLimit();
  //   }
  // }, [gasFeeParamsBySpeed, isGasReady, prevGasFeesParamsBySpeed, prevTxNetwork, txNetwork, updateGasLimit]);

  useEffect(() => {
    if (asset && prevAsset?.address !== asset?.address && prevAsset?.chainId !== asset?.chainId) {
      setChainId(asset.chainId);
    }
  }, [asset, flashbots, prevAsset?.address, prevAsset?.chainId]);

  useEffect(() => {
    if (isEmpty(prevGasFeesParamsBySpeed) && !isEmpty(gasFeeParamsBySpeed)) {
      const defaultLimit = ethereumUtils.getBasicSwapGasLimit(chainId);

      updateTxFee(defaultLimit, null);
    }
  }, [chainId, gasFeeParamsBySpeed, prevGasFeesParamsBySpeed, updateTxFee]);

  useEffect(() => {
    const defaultLimit = ethereumUtils.getBasicSwapGasLimit(chainId);
    updateDefaultGasLimit(defaultLimit);
    InteractionManager.runAfterInteractions(() => {
      // Start polling in the current network
      const network = ethereumUtils.getNetworkFromChainId(chainId);
      const swapSupportsFlashbots = getNetworkObj(network).features.flashbots;
      startPollingGasFees(network, swapSupportsFlashbots && flashbots);
    });
    return () => {
      stopPollingGasFees();
    };
  }, [startPollingGasFees, stopPollingGasFees, updateDefaultGasLimit, flashbots, chainId]);

  // Because of the animated number component
  // we need to trim the native currency symbol
  // (and leave the number only!)
  // which gets added later in the formatGasPrice function
  const price = useMemo(() => {
    const gasPrice = selectedGasFee?.gasFee?.estimatedFee?.native?.value?.display;
    if (isNil(gasPrice)) return null;
    return gasPrice
      .replace(',', '') // In case gas price is > 1k!
      .replace(nativeCurrencySymbol, '')
      .trim();
  }, [nativeCurrencySymbol, selectedGasFee]);

  const network = ethereumUtils.getNetworkFromChainId(chainId);
  const isLegacyGasNetwork = getNetworkObj(network).gas.gasType === 'legacy';

  const formatGasPrice = useCallback(
    (animatedValue: number) => {
      if (animatedValue === null || loading || isNaN(animatedValue)) {
        return 0;
      }
      // L2's are very cheap,
      // so let's default to the last 2 significant decimals
      if (isLegacyGasNetwork) {
        const numAnimatedValue = Number.parseFloat(animatedValue.toString());
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
    [loading, isLegacyGasNetwork, nativeCurrencySymbol, nativeCurrency]
  );

  const renderGasPriceText = useCallback(
    (animatedNumber: number) => {
      const priceText = animatedNumber === 0 || loading ? lang.t('swap.loading') : animatedNumber;
      return (
        <Text color="labelQuaternary" size="15pt" weight="heavy">
          {priceText}
        </Text>
      );
    },
    [loading]
  );

  const buttonWrapperStyles = useAnimatedStyle(() => {
    return {
      borderColor: SwapInputController.bottomColor.value,
    };
  });

  if (isReviewing) {
    return (
      <Inline alignVertical="center" wrap={false}>
        <GasContextMenu chainId={chainId} price={price}>
          <Box as={Animated.View} style={[styles.buttonWrapperStaticStyles, buttonWrapperStyles]}>
            <Inline alignVertical="center" space="4px">
              <TextIcon color={'red'} height={10} size="icon 12px" textStyle={{ marginTop: -1.5 }} width={16} weight="bold">
                {GAS_EMOJIS[selectedGasFee?.option || GasSpeed.FAST]}
              </TextIcon>
              <Text color="label" size="15pt" weight="heavy">
                {getGasLabel(selectedGasFee?.option || GasSpeed.FAST)}
              </Text>
            </Inline>
            <TextIcon color="labelSecondary" height={10} size="icon 13px" weight="bold" width={12}>
              􀆏
            </TextIcon>
          </Box>
        </GasContextMenu>

        <ButtonPressAnimation onPress={() => runOnUI(SwapNavigation.handleShowGas)(true)}>
          <Box
            style={{
              paddingHorizontal: 7,
              paddingVertical: 6,
              gap: 10,
              borderRadius: 15,
              borderWidth: THICK_BORDER_WIDTH,
              borderColor: separatatorSecondary,
            }}
          >
            <Text weight="heavy" size="15pt" color="label">
              􀌆
            </Text>
          </Box>
        </ButtonPressAnimation>
      </Inline>
    );
  }

  return (
    <GasContextMenu chainId={chainId} price={price}>
      <Stack space="12px">
        <Inline alignVertical="center" space={{ custom: 5 }}>
          <Inline alignVertical="center" space="4px">
            <Text color="label" size="12pt" weight="bold">
              {GAS_EMOJIS[selectedGasFee?.option || GasSpeed.FAST]}
            </Text>
            <Text color="label" size="15pt" weight="heavy">
              {getGasLabel(selectedGasFee?.option || GasSpeed.FAST)}
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
          <AnimateNumber
            formatter={formatGasPrice}
            interval={6}
            renderContent={renderGasPriceText}
            steps={6}
            timing="linear"
            value={price}
          />
        </Inline>
      </Stack>
    </GasContextMenu>
  );
};

const GasContextMenu = ({ chainId, price, children }: { chainId: ChainId; price: string | null; children: React.ReactNode }) => {
  const { SwapNavigation } = useSwapContext();

  const { gasFeeParamsBySpeed, updateGasFeeOption, selectedGasFee, selectedGasFeeOption, currentBlockParams } = useGas();

  const network = ethereumUtils.getNetworkFromChainId(chainId);
  const isL2 = useMemo(() => isL2Network(network), [network]);

  const gasIsNotReady = useMemo(
    () => isNil(price) || isEmpty(gasFeeParamsBySpeed) || isEmpty(selectedGasFee?.gasFee),
    [gasFeeParamsBySpeed, price, selectedGasFee]
  );

  const speedOptions = useMemo(() => {
    return getNetworkObj(network).gas.speeds;
  }, [network]);

  const handlePressSpeedOption = useCallback(
    (selectedSpeed: string) => {
      if (selectedSpeed === CUSTOM) {
        const currentBaseFee = currentBlockParams?.baseFeePerGas?.display;
        const maxBaseFee = gasFeeParamsBySpeed?.[CUSTOM]?.maxBaseFee?.gwei;
        const priorityFee = gasFeeParamsBySpeed?.[CUSTOM]?.maxPriorityFeePerGas?.gwei;

        runOnUI(SwapNavigation.handleShowGas)({
          currentBaseFee,
          maxBaseFee,
          priorityFee,
        });
      }

      updateGasFeeOption(selectedSpeed);
    },
    [SwapNavigation.handleShowGas, currentBlockParams?.baseFeePerGas?.display, gasFeeParamsBySpeed, updateGasFeeOption]
  );

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: Omit<OnPressMenuItemEventObject, 'isUsingActionSheetFallback'>) => {
      handlePressSpeedOption(actionKey);
    },
    [handlePressSpeedOption]
  );

  const menuConfig = useMemo(() => {
    const menuOptions = speedOptions.map(gasOption => {
      if (IS_ANDROID) return gasOption;

      const totalGwei = add(gasFeeParamsBySpeed[gasOption]?.maxBaseFee?.gwei, gasFeeParamsBySpeed[gasOption]?.maxPriorityFeePerGas?.gwei);
      const estimatedGwei = add(currentBlockParams?.baseFeePerGas?.gwei, gasFeeParamsBySpeed[gasOption]?.maxPriorityFeePerGas?.gwei);

      const shouldRoundGwei = getNetworkObj(network).gas.roundGasDisplay;
      const gweiDisplay = !shouldRoundGwei
        ? gasFeeParamsBySpeed[gasOption]?.gasPrice?.amount
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
  }, [currentBlockParams?.baseFeePerGas?.gwei, network, gasFeeParamsBySpeed, selectedGasFeeOption, speedOptions, isL2]);

  const gasOptionsAvailable = useMemo(() => speedOptions.length > 1, [speedOptions.length]);

  if (!gasOptionsAvailable || gasIsNotReady) return children;

  if (IS_ANDROID) {
    return (
      <ContextMenu
        activeOpacity={0}
        enableContextMenu
        isAnchoredToRight
        isMenuPrimaryAction
        onPressActionSheet={(index: number) => handlePressMenuItem({ nativeEvent: { actionKey: speedOptions[index], actionTitle: '' } })}
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
};

const styles = StyleSheet.create({
  buttonWrapperStaticStyles: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
