import React, { memo } from 'react';

import { POLYMARKET_ACCENT_COLOR, POLYMARKET_BACKGROUND_DARK, POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { POLYMARKET_DEPOSIT_CONFIG } from '@/features/polymarket/depositConfig';
import { createPolymarketDepositRuntimeExtensions } from '@/features/polymarket/stores/polymarketDepositRuntimeExtensions';
import { useStableValue } from '@/hooks/useStableValue';
import { DepositScreen } from '@/systems/funding/components/DepositScreen';

export const PolymarketDepositScreen = memo(function PolymarketDepositScreen() {
  const runtimeExtensions = useStableValue(createPolymarketDepositRuntimeExtensions);

  return (
    <DepositScreen
      config={POLYMARKET_DEPOSIT_CONFIG}
      runtimeExtensions={runtimeExtensions}
      theme={{
        accent: POLYMARKET_ACCENT_COLOR,
        backgroundDark: POLYMARKET_BACKGROUND_DARK,
        backgroundLight: POLYMARKET_BACKGROUND_LIGHT,
      }}
    />
  );
});
