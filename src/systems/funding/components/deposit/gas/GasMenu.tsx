import React, { ReactNode, useCallback, useMemo } from 'react';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ContextMenu } from '@/components/context-menu';
import { Centered } from '@/components/layout';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { Box } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { add, formatNumber } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { weiToGwei } from '@/parsers';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { GasSpeed } from '@/__swaps__/types/gas';
import { useDepositContext } from '@/systems/funding/contexts/DepositContext';
import gasUtils from '@/utils/gas';

const GAS_BUTTON_HIT_SLOP = 16;
const SWAP_GAS_ICONS = gasUtils.SWAP_GAS_ICONS;

export function GasMenu({ children, onSelectGasSpeed }: { children: ReactNode; onSelectGasSpeed: (speed: GasSpeed) => void }) {
  const { gasStores } = useDepositContext();
  const metereologySuggestions = gasStores.useMeteorologyStore(state => state.getGasSuggestions());
  const menuOptions = useMemo(() => keys(metereologySuggestions), [metereologySuggestions]);

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
      handlePressSpeedOption(menuOptions[buttonIndex]);
    },
    [handlePressSpeedOption, menuOptions]
  );

  const menuConfig = useMemo(() => {
    const menuItems = menuOptions.map(gasOption => {
      const gasSettings = metereologySuggestions?.[gasOption];
      const currentBaseFee = gasSettings?.isEIP1559 ? gasSettings.maxBaseFee : undefined;
      const subtitle = getEstimatedFeeRangeInGwei(gasSettings, currentBaseFee);

      return {
        actionKey: gasOption,
        actionTitle: i18n.t(i18n.l.gas.speeds[gasOption]),
        discoverabilityTitle: subtitle,
        icon: { iconType: 'SYSTEM', iconValue: SWAP_GAS_ICONS[gasOption].symbolName },
      };
    });
    return { menuItems, menuTitle: '' };
  }, [menuOptions, metereologySuggestions]);

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

function keys<const T extends string>(obj: Record<T, unknown> | undefined): T[] {
  const keys: T[] = [];
  if (!obj) return keys;
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    keys.push(key);
  }
  return keys;
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
