import React, { memo } from 'react';
import { WithdrawalScreen } from '@/features/funding/components/WithdrawalScreen';
import { HYPERLIQUID_COLORS, PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { PERPS_WITHDRAWAL_CONFIG } from '@/features/perps/withdrawalConfig';

// ============ Screen ========================================================= //

export const PerpsWithdrawalScreen = memo(function PerpsWithdrawalScreen() {
  return (
    <WithdrawalScreen
      config={PERPS_WITHDRAWAL_CONFIG}
      theme={{
        accent: HYPERLIQUID_COLORS.green,
        backgroundDark: PERPS_BACKGROUND_DARK,
        backgroundLight: PERPS_BACKGROUND_LIGHT,
      }}
    />
  );
});
