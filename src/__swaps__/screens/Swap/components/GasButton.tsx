import { ChainId } from '@/__swaps__/types/chains';
import { GasSpeed } from '@/__swaps__/types/gas';
import { weiToGwei } from '@/__swaps__/utils/ethereum';
import { getCachedCurrentBaseFee, useMeteorologySuggestions } from '@/__swaps__/utils/meteorology';
import { add, formatNumber } from '@/__swaps__/utils/numbers';
import { ButtonPressAnimation } from '@/components/animations';
import { ContextMenu } from '@/components/context-menu';
import { Centered } from '@/components/layout';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { Box, Inline, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { IS_ANDROID } from '@/env';
import * as i18n from '@/languages';
import { swapsStore } from '@/state/swaps/swapsStore';
import { gasUtils } from '@/utils';
import React, { PropsWithChildren, ReactNode, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { OnPressMenuItemEventObject } from 'react-native-ios-context-menu';
import { runOnJS, runOnUI } from 'react-native-reanimated';
import { ETH_COLOR, ETH_COLOR_DARK, THICK_BORDER_WIDTH } from '../constants';
import { GasSettings, useCustomGasSettings } from '../hooks/useCustomGas';
import { setSelectedGasSpeed, useSelectedGas, useSelectedGasSpeed } from '../hooks/useSelectedGas';
import { NavigationSteps, useSwapContext } from '../providers/swap-provider';
import { EstimatedSwapGasFee, EstimatedSwapGasFeeSlot } from './EstimatedSwapGasFee';
import { GestureHandlerV1Button } from './GestureHandlerV1Button';
import { UnmountOnAnimatedReaction } from './UnmountOnAnimatedReaction';

const { GAS_ICONS } = gasUtils;
const GAS_BUTTON_HIT_SLOP = 16;

function UnmountWhenGasButtonIsNotInScreen({ placeholder, children }: PropsWithChildren<{ placeholder: ReactNode }>) {
  const { configProgress } = useSwapContext();
  return (
    <UnmountOnAnimatedReaction
      isMountedWorklet={() => {
        'worklet';
        // unmount when custom gas or review panels are above it
        return !(configProgress.value === NavigationSteps.SHOW_GAS || configProgress.value === NavigationSteps.SHOW_REVIEW);
      }}
      placeholder={placeholder}
    >
      {children}
    </UnmountOnAnimatedReaction>
  );
}

function EstimatedGasFee() {
  const chainId = swapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);
  const gasSettings = useSelectedGas(chainId);

  return (
    <Inline alignVertical="center" space="4px">
      <TextIcon color="labelQuaternary" height={10} size="icon 11px" weight="heavy" width={16}>
        􀵟
      </TextIcon>
      <UnmountWhenGasButtonIsNotInScreen placeholder={<EstimatedSwapGasFeeSlot text="--" />}>
        <EstimatedSwapGasFee gasSettings={gasSettings} />
      </UnmountWhenGasButtonIsNotInScreen>
    </Inline>
  );
}

function SelectedGas() {
  const chainId = swapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);
  const selectedGasSpeed = useSelectedGasSpeed(chainId);

  return (
    <Inline alignVertical="center" space={{ custom: 5 }}>
      <Inline alignVertical="center" space="4px">
        <TextIcon color={'red'} height={10} size="icon 12px" textStyle={{ marginTop: -1.5 }} width={16} weight="bold">
          􀙭
        </TextIcon>
        <Text color="label" size="15pt" weight="heavy">
          {i18n.t(i18n.l.gas.speeds[selectedGasSpeed])}
        </Text>
      </Inline>
      <TextIcon color="labelSecondary" height={10} size="icon 13px" weight="bold" width={12}>
        􀆏
      </TextIcon>
    </Inline>
  );
}

function getEstimatedFeeRangeInGwei(gasSettings: GasSettings | undefined, currentBaseFee: string | undefined) {
  if (!gasSettings) return undefined;

  if (!gasSettings.isEIP1559) return `${formatNumber(weiToGwei(gasSettings.gasPrice))} Gwei`;

  const { maxBaseFee, maxPriorityFee } = gasSettings;
  const maxFee = formatNumber(weiToGwei(add(maxBaseFee, maxPriorityFee)));

  if (!currentBaseFee) return `${maxFee} Gwei`;

  const minFee = formatNumber(weiToGwei(add(currentBaseFee, maxPriorityFee)));

  return `${minFee} - ${maxFee} Gwei`;
}

function keys<const T extends string>(obj: Record<T, any> | undefined) {
  if (!obj) return [];
  return Object.keys(obj) as T[];
}

const GasMenu = ({ backToReview = false, children }: { backToReview?: boolean; children: ReactNode }) => {
  const { SwapNavigation } = useSwapContext();

  const chainId = swapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);
  const metereologySuggestions = useMeteorologySuggestions({ chainId });
  const customGasSettings = useCustomGasSettings(chainId);

  const menuOptions = useMemo(() => [...keys(metereologySuggestions.data), GasSpeed.CUSTOM] as GasSpeed[], [metereologySuggestions.data]);

  const handlePressSpeedOption = useCallback(
    (selectedGasSpeed: GasSpeed) => {
      setSelectedGasSpeed(chainId, selectedGasSpeed);
      if (selectedGasSpeed === GasSpeed.CUSTOM) {
        runOnUI(SwapNavigation.handleShowGas)({ backToReview });
      }
    },
    [SwapNavigation.handleShowGas, backToReview, chainId]
  );

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: OnPressMenuItemEventObject) => handlePressSpeedOption(actionKey as GasSpeed),
    [handlePressSpeedOption]
  );

  const handlePressActionSheet = useCallback(
    (buttonIndex: number) => {
      if (buttonIndex < 0) return;
      handlePressSpeedOption(menuOptions[buttonIndex]);
    },
    [handlePressSpeedOption, menuOptions]
  );

  const menuConfig = useMemo(() => {
    const menuItems = menuOptions.map(gasOption => {
      if (IS_ANDROID) return gasOption;

      const currentBaseFee = getCachedCurrentBaseFee(chainId);
      const gasSettings = gasOption === GasSpeed.CUSTOM ? customGasSettings : metereologySuggestions.data?.[gasOption];
      const subtitle = getEstimatedFeeRangeInGwei(gasSettings, currentBaseFee);

      return {
        actionKey: gasOption,
        actionTitle: i18n.t(i18n.l.gas.speeds[gasOption]),
        discoverabilityTitle: subtitle,
        icon: { iconType: 'ASSET', iconValue: GAS_ICONS[gasOption] },
      };
    });
    return { menuItems, menuTitle: '' };
  }, [customGasSettings, menuOptions, metereologySuggestions.data, chainId]);

  if (metereologySuggestions.isLoading) return children;

  return (
    <Box alignItems="center" justifyContent="center" style={{ margin: IS_ANDROID ? 0 : -GAS_BUTTON_HIT_SLOP }} testID="gas-speed-pager">
      {IS_ANDROID ? (
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
          <Centered>
            <ButtonPressAnimation scaleTo={0.825}>{children}</ButtonPressAnimation>
          </Centered>
        </ContextMenu>
      ) : (
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
          <ButtonPressAnimation scaleTo={0.825} style={{ padding: GAS_BUTTON_HIT_SLOP }}>
            {children}
          </ButtonPressAnimation>
        </ContextMenuButton>
      )}
    </Box>
  );
};

export function ReviewGasButton() {
  const { isDarkMode } = useColorMode();
  const { SwapNavigation, internalSelectedInputAsset } = useSwapContext();

  const separatatorSecondary = useForegroundColor('separatorSecondary');

  const handleShowCustomGas = () => {
    'worklet';

    runOnJS(setSelectedGasSpeed)(internalSelectedInputAsset.value?.chainId || ChainId.mainnet, GasSpeed.CUSTOM);
    SwapNavigation.handleShowGas({ backToReview: true });
  };

  return (
    <Inline alignVertical="center" wrap={false}>
      <GasMenu backToReview>
        <Box
          style={[
            sx.reviewGasButtonPillStyles,
            {
              borderColor: isDarkMode ? ETH_COLOR_DARK : ETH_COLOR,
            },
          ]}
        >
          <SelectedGas />
        </Box>
      </GasMenu>

      <GestureHandlerV1Button onPressStartWorklet={handleShowCustomGas}>
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
      </GestureHandlerV1Button>
    </Inline>
  );
}

export const GasButton = () => {
  return (
    <GasMenu>
      <Box gap={12}>
        <SelectedGas />
        <EstimatedGasFee />
      </Box>
    </GasMenu>
  );
};

const sx = StyleSheet.create({
  reviewGasButtonPillStyles: {
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
