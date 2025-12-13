import React, { memo } from 'react';
import { WithdrawalScreen } from '@/features/funding/components/WithdrawalScreen';
import { POLYMARKET_ACCENT_COLOR, POLYMARKET_BACKGROUND_DARK, POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { POLYMARKET_WITHDRAWAL_CONFIG } from '@/features/polymarket/withdrawalConfig';

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
