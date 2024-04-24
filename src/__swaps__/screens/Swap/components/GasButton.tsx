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
import { StyleSheet } from 'react-native';

const { GAS_EMOJIS, GAS_ICONS, CUSTOM, getGasLabel } = gasUtils;

export const GasButton = ({ isReviewing = false, loading = false }) => {
  const separatatorSecondary = useForegroundColor('separatorSecondary');

  const { SwapInputController, SwapNavigation } = useSwapContext();
  const { nativeCurrencySymbol, nativeCurrency } = useAccountSettings();

  const [asset, setAsset] = useState<ParsedSearchAsset | null>(null);
  const [chainId, setChainId] = useState<ChainId>(ChainId.mainnet);

  const prevAsset = usePrevious(asset);

  useEffect(() => {
    if (asset && prevAsset?.address !== asset?.address && prevAsset?.chainId !== asset?.chainId) {
      setChainId(asset.chainId);
    }
  }, [asset, prevAsset?.address, prevAsset?.chainId]);

  // NOTE: keep this local state in sync with asset to buy
  useSyncSharedValue<ParsedSearchAsset | null, 'sharedToState'>({
    setState: setAsset,
    state: asset,
    syncDirection: 'sharedToState',
    sharedValue: SwapInputController.assetToBuy,
  });

  const { selectedGasFee } = useGas();

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
                􀙭
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
            <TextIcon color={'red'} height={10} size="icon 12px" textStyle={{ marginTop: -1.5 }} width={16} weight="bold">
              􀙭
            </TextIcon>
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
  //   <Container horizontalPadding={horizontalPadding} marginBottom={marginBottom} marginTop={marginTop} testID={testID}>
  //     <Row justify="space-between">
  //       <ButtonPressAnimation scaleTo={0.9} testID="estimated-fee-label" disallowInterruption={false}>
  //         <Row>
  //           <NativeCoinIconWrapper>
  //             <AnimatePresence>
  //               {!!network && (
  //                 <MotiView
  //                   animate={{ opacity: 1 }}
  //                   from={{ opacity: 0 }}
  //                   transition={{
  //                     duration: 300,
  //                     easing: Easing.bezier(0.2, 0, 0, 1),
  //                     type: 'timing',
  //                   }}
  //                 >
  //                   {network === Network.mainnet ? (
  //                     <EthCoinIcon size={18} />
  //                   ) : (
  //                     <ChainBadge network={network} size="gas" position="relative" />
  //                   )}
  //                 </MotiView>
  //               )}
  //             </AnimatePresence>
  //           </NativeCoinIconWrapper>
  //           <TextContainer>
  //             <Text>
  //               <AnimateNumber
  //                 formatter={formatGasPrice}
  //                 interval={6}
  //                 renderContent={renderGasPriceText}
  //                 steps={6}
  //                 timing="linear"
  //                 value={price}
  //               />
  //               <Text letterSpacing="one" size="lmedium" weight="heavy">
  //                 {' '}
  //               </Text>
  //               <TransactionTimeLabel formatter={formatTransactionTime} theme={theme} isLongWait={isLongWait} />
  //             </Text>
  //           </TextContainer>
  //         </Row>
  //         <Row justify="space-between">
  //           <Label
  //             color={theme === 'dark' ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.6) : colors.alpha(colors.blueGreyDark, 0.6)}
  //             size="smedium"
  //             weight="bold"
  //           >
  //             {lang.t('swap.gas.estimated_fee')}{' '}
  //             <Label
  //               color={theme === 'dark' ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.25) : colors.alpha(colors.blueGreyDark, 0.25)}
  //               size="smedium"
  //               weight="bold"
  //             >
  //               􀅵
  //             </Label>
  //           </Label>
  //         </Row>
  //       </ButtonPressAnimation>
  //       <Centered>
  //         <GasSpeedPagerCentered testID="gas-speed-pager">{renderGasSpeedPager}</GasSpeedPagerCentered>

  //         <Centered>
  //           {!isLegacyGasNetwork && (
  //             <ButtonPressAnimation onPress={() => runOnUI(SwapNavigation.handleShowGas)(true)}>
  //               <Box
  //                 style={{
  //                   paddingHorizontal: 7,
  //                   paddingVertical: 6,
  //                   gap: 10,
  //                   borderRadius: 15,
  //                   borderWidth: THICK_BORDER_WIDTH,
  //                   borderColor: separatatorSecondary,
  //                 }}
  //               >
  //                 <Text weight="heavy" size="15pt" color="label">
  //                   􀌆
  //                 </Text>
  //               </Box>
  //             </ButtonPressAnimation>
  //           )}
  //         </Centered>
  //       </Centered>
  //     </Row>
  //   </Container>
  // );
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
        runOnUI(SwapNavigation.handleShowGas)();
      } else {
        updateGasFeeOption(selectedSpeed);
      }
    },
    [SwapNavigation.handleShowGas, updateGasFeeOption]
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
        ? gasFeeParamsBySpeed[gasOption]?.gasPrice?.display
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
