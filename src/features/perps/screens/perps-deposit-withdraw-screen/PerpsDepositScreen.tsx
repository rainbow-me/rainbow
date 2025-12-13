import React, { memo } from 'react';
import { DepositScreen } from '@/features/funding/components/DepositScreen';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT, HYPERLIQUID_COLORS } from '@/features/perps/constants';
import { PERPS_DEPOSIT_CONFIG } from '@/features/perps/depositConfig';

// ============ Screen ========================================================= //

export const PerpsDepositScreen = memo(function PerpsDepositScreen() {
  return (
    <DepositScreen
      config={PERPS_DEPOSIT_CONFIG}
      theme={{
        accent: HYPERLIQUID_COLORS.green,
        backgroundDark: PERPS_BACKGROUND_DARK,
        backgroundLight: PERPS_BACKGROUND_LIGHT,
      }}
    />
  );
});
