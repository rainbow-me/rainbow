import React, { ReactNode, useCallback, useMemo } from 'react';
import { GasSpeed } from '@/__swaps__/types/gas';
import { getCachedCurrentBaseFee, useMeteorologySuggestions } from '@/__swaps__/utils/meteorology';
import { Box } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { ContextMenu } from '@/components/context-menu';
import { Centered } from '@/components/layout';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { IS_ANDROID } from '@/env';
import i18n from '@/languages';
import { add, formatNumber } from '@/helpers/utilities';
import { weiToGwei } from '@/parsers';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { gasUtils } from '@/utils';

const { SWAP_GAS_ICONS } = gasUtils;
const GAS_BUTTON_HIT_SLOP = 16;

function keys<const T extends string>(obj: Record<T, unknown> | undefined) {
  if (!obj) return [];
  return Object.keys(obj) as T[];
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

export function GasMenu({
  children,
  chainId,
  onSelectGasSpeed,
}: {
  children: ReactNode;
  chainId: number;
  onSelectGasSpeed: (speed: GasSpeed) => void;
}) {
  const { data: metereologySuggestions, isLoading } = useMeteorologySuggestions({ chainId });

  const menuOptions = useMemo(() => [...keys(metereologySuggestions)], [metereologySuggestions]);

  const handlePressSpeedOption = useCallback(
    (selectedGasSpeed: GasSpeed) => {
      onSelectGasSpeed(selectedGasSpeed);
    },
    [onSelectGasSpeed]
  );

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: GasSpeed } }) => handlePressSpeedOption(actionKey),
    [handlePressSpeedOption]
  );

  const handlePressActionSheet = useCallback(
    (buttonIndex: number | undefined) => {
      if (buttonIndex == null || buttonIndex < 0) return;
      handlePressSpeedOption(menuOptions[buttonIndex] as GasSpeed);
    },
    [handlePressSpeedOption, menuOptions]
  );

  const menuConfig = useMemo(() => {
    const menuItems = menuOptions.map(gasOption => {
      const currentBaseFee = getCachedCurrentBaseFee(chainId);
      const gasSettings = metereologySuggestions?.[gasOption];
      const subtitle = getEstimatedFeeRangeInGwei(gasSettings, currentBaseFee);

      return {
        actionKey: gasOption,
        actionTitle: i18n.gas.speeds[gasOption](),
        discoverabilityTitle: subtitle,
        icon: { iconType: 'SYSTEM', iconValue: SWAP_GAS_ICONS[gasOption].symbolName },
      };
    });
    return { menuItems, menuTitle: '' };
  }, [menuOptions, metereologySuggestions, chainId]);

  if (isLoading) return children;

  return (
    <Box alignItems="center" justifyContent="center" style={{ margin: IS_ANDROID ? 0 : -GAS_BUTTON_HIT_SLOP }} testID="gas-speed-pager">
      {IS_ANDROID ? (
        <ContextMenu
          activeOpacity={0}
          enableContextMenu
          isAnchoredToRight
          isMenuPrimaryAction
          onPressActionSheet={handlePressActionSheet}
          options={menuOptions}
          useActionSheetFallback={false}
          wrapNativeComponent={false}
        >
          <Centered>
            <ButtonPressAnimation scaleTo={0.825}>{children}</ButtonPressAnimation>
          </Centered>
        </ContextMenu>
      ) : (
        <ContextMenuButton
          enableContextMenu
          isMenuPrimaryAction
          menuConfig={menuConfig}
          onPressMenuItem={handlePressMenuItem}
          useActionSheetFallback={false}
        >
          <ButtonPressAnimation scaleTo={0.825} style={{ padding: GAS_BUTTON_HIT_SLOP }}>
            {children}
          </ButtonPressAnimation>
        </ContextMenuButton>
      )}
    </Box>
  );
}
