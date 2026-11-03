import React, { useCallback, useMemo, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { Box } from '@/design-system';
import { formatGasFeeRange } from '@/features/gas/core/formatGasFee';
import { type GasSpeed } from '@/features/gas/types/gasSpeed';
import gasUtils from '@/features/gas/utils/gas';
import * as i18n from '@/languages';
import { useDepositContext } from '@/systems/funding/contexts/DepositContext';

const GAS_BUTTON_HIT_SLOP = 16;
const SWAP_GAS_ICONS = gasUtils.SWAP_GAS_ICONS;

/** Shows the deposit gas options and reports the selected speed. */
export function GasMenu({ children, onSelectGasSpeed }: { children: ReactNode; onSelectGasSpeed: (speed: GasSpeed) => void }) {
  const { gasStores } = useDepositContext();
  const isGasSponsored = gasStores.useIsGasSponsored();
  const metereologySuggestions = gasStores.useMeteorologyStore(state => state.getGasSuggestions());
  const menuOptions = useMemo(() => keys(metereologySuggestions), [metereologySuggestions]);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: GasSpeed } }) => onSelectGasSpeed(actionKey),
    [onSelectGasSpeed]
  );

  const menuConfig = useMemo(() => {
    const menuItems = menuOptions.map(gasOption => {
      const gasSettings = metereologySuggestions?.[gasOption];
      const currentBaseFee = gasSettings?.isEIP1559 ? gasSettings.maxBaseFee : undefined;
      const subtitle = formatGasFeeRange(gasSettings, currentBaseFee);

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
    <Box
      alignItems="center"
      justifyContent="center"
      style={{ margin: Platform.OS === 'android' ? 0 : -GAS_BUTTON_HIT_SLOP }}
      testID="gas-speed-pager"
      pointerEvents={isGasSponsored ? 'none' : 'auto'}
    >
      <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={handlePressMenuItem}>
        <ButtonPressAnimation scaleTo={0.825} style={Platform.OS === 'android' ? undefined : { padding: GAS_BUTTON_HIT_SLOP }}>
          {children}
        </ButtonPressAnimation>
      </ContextMenuButton>
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
