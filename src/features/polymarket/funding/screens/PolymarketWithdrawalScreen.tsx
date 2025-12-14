import React, { memo } from 'react';
import { POLYMARKET_ACCENT_COLOR, POLYMARKET_BACKGROUND_DARK, POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { POLYMARKET_WITHDRAWAL_CONFIG } from '@/features/polymarket/withdrawalConfig';
import { WithdrawalScreen } from '@/systems/funding/components/WithdrawalScreen';

export const PolymarketWithdrawalScreen = memo(function PolymarketWithdrawalScreen() {
  return (
    <WithdrawalScreen
      config={POLYMARKET_WITHDRAWAL_CONFIG}
      theme={{
        accent: POLYMARKET_ACCENT_COLOR,
        backgroundDark: POLYMARKET_BACKGROUND_DARK,
        backgroundLight: POLYMARKET_BACKGROUND_LIGHT,
      }}
    />
  );
});
