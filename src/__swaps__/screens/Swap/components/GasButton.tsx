import { weiToGwei } from '@/__swaps__/utils/ethereum';
import { useMeteorologySuggestions } from '@/__swaps__/utils/meteorology';
import { add } from '@/__swaps__/utils/numbers';
import { ButtonPressAnimation } from '@/components/animations';
import { ContextMenu } from '@/components/context-menu';
import { Centered } from '@/components/layout';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { Box, Inline, Stack, Text, TextIcon, useForegroundColor } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useAccountSettings } from '@/hooks';
import * as i18n from '@/languages';
import styled from '@/styled-thing';
import { gasUtils } from '@/utils';
import React, { ReactNode, useCallback, useMemo, useState } from 'react';
import { runOnUI } from 'react-native-reanimated';
import { THICK_BORDER_WIDTH } from '../constants';
import { formatNumber } from '../hooks/formatNumber';
import { GasSettings, useCustomGasSettings } from '../hooks/useCustomGas';
import { useSwapEstimatedGasFee } from '../hooks/useEstimatedGasFee';
import { useRouteChainId } from '../hooks/useRouteNetwork';
import { GasSpeed, setSelectedGasSpeed, useSelectedGasSpeed } from '../hooks/useSelectedGas';
import { useSwapContext } from '../providers/swap-provider';

const { CUSTOM, GAS_ICONS } = gasUtils;

function EstimatedGasFee() {
  const estimatedGasFee = useSwapEstimatedGasFee();

  return (
    <Inline alignVertical="center" space="4px">
      <TextIcon color="labelQuaternary" height={10} size="icon 11px" weight="heavy" width={16}>
        􀵟
      </TextIcon>
      <Text color="labelTertiary" size="15pt" weight="bold">
        {estimatedGasFee}
      </Text>
    </Inline>
  );
}

function SelectedGas() {
  const chainId = useRouteChainId();
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

const GasSpeedPagerCentered = styled(Centered).attrs(() => ({
  marginHorizontal: 8,
}))({});

function getEstimatedFeeRangeInGwei(gasSettings: GasSettings | undefined, currentBaseFee?: string | undefined) {
  if (!gasSettings) return undefined;

  if (!gasSettings.isEIP1559) return `${formatNumber(weiToGwei(gasSettings.gasPrice))} Gwei`;

  const { maxBaseFee, maxPriorityFee } = gasSettings;
  return `${formatNumber(weiToGwei(add(maxBaseFee, maxPriorityFee)))} Gwei`;

  // return `${formatNumber(weiToGwei(add(baseFee, maxPriorityFee)))} - ${formatNumber(
  //   weiToGwei(add(maxBaseFee, maxPriorityFee))
  // )} Gwei`;
}

function keys<const T extends string>(obj: Record<T, any> | undefined) {
  if (!obj) return [];
  return Object.keys(obj) as T[];
}

const GasMenu = ({ children }: { children: ReactNode }) => {
  const { SwapNavigation } = useSwapContext();

  useAccountSettings();

  const chainId = useRouteChainId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const metereologySuggestions = useMeteorologySuggestions({ chainId, enabled: isMenuOpen });
  const customGasSettings = useCustomGasSettings(chainId);

  const menuOptions = useMemo(() => [...keys(metereologySuggestions.data), 'custom'] as const, [metereologySuggestions.data]);

  const handlePressSpeedOption = useCallback(
    (selectedGasSpeed: GasSpeed) => {
      // TODO: Handle updating SwapGas references
      // SwapGas.selectGasOption(selectedGasSpeed);
      if (selectedGasSpeed === CUSTOM) {
        runOnUI(SwapNavigation.handleShowGas)({});
      }
      setSelectedGasSpeed(chainId, selectedGasSpeed);
    },
    [SwapNavigation.handleShowGas, chainId]
  );

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: any) => handlePressSpeedOption(actionKey),
    [handlePressSpeedOption]
  );

  const handlePressActionSheet = useCallback(
    (buttonIndex: number) => handlePressSpeedOption(menuOptions[buttonIndex]),
    [handlePressSpeedOption, menuOptions]
  );

  const menuConfig = useMemo(() => {
    const menuItems = menuOptions.map(gasOption => {
      if (IS_ANDROID) return gasOption;

      // const currentBaseFee = getCachedCurrentBaseFee(chainId);
      const gasSettings = gasOption === 'custom' ? customGasSettings : metereologySuggestions.data?.[gasOption];
      const subtitle = getEstimatedFeeRangeInGwei(gasSettings);

      return {
        actionKey: gasOption,
        actionTitle: i18n.t(i18n.l.gas.speeds[gasOption]),
        discoverabilityTitle: subtitle,
        icon: {
          iconType: 'ASSET',
          iconValue: GAS_ICONS[gasOption],
        },
      };
    });
    return {
      menuItems,
      menuTitle: '',
    };
  }, [customGasSettings, menuOptions, metereologySuggestions.data]);

  if (metereologySuggestions.isLoading) return children;

  return (
    <GasSpeedPagerCentered testID="gas-speed-pager">
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
          <Centered>{children}</Centered>
        </ContextMenu>
      ) : (
        <ContextMenuButton
          onMenuDidShow={() => setIsMenuOpen(true)}
          onMenuWillHide={() => setIsMenuOpen(false)}
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
      )}
    </GasSpeedPagerCentered>
  );
};

export function ReviewGasButton() {
  const { SwapNavigation } = useSwapContext();

  const separatatorSecondary = useForegroundColor('separatorSecondary');

  return (
    <Inline alignVertical="center" wrap={false}>
      <GasMenu>
        <SelectedGas />
      </GasMenu>

      <ButtonPressAnimation onPress={() => runOnUI(SwapNavigation.handleShowGas)({ backToReview: true })}>
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

export const GasButton = () => {
  return (
    <GasMenu>
      <Stack space="12px">
        <SelectedGas />
        <EstimatedGasFee />
      </Stack>
    </GasMenu>
  );
};
