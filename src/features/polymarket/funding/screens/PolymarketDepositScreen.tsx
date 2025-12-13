import React, { memo } from 'react';
import { DepositScreen } from '@/features/funding/components/DepositScreen';
import { POLYMARKET_ACCENT_COLOR, POLYMARKET_BACKGROUND_DARK, POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { POLYMARKET_DEPOSIT_CONFIG } from '@/features/polymarket/depositConfig';

export const PolymarketDepositScreen = memo(function PolymarketDepositScreen() {
  return (
    <DepositScreen
      config={POLYMARKET_DEPOSIT_CONFIG}
      theme={{
        accent: POLYMARKET_ACCENT_COLOR,
        backgroundDark: POLYMARKET_BACKGROUND_DARK,
        backgroundLight: POLYMARKET_BACKGROUND_LIGHT,
      }}
    />
  );
});
