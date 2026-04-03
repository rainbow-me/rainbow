import React, { memo } from 'react';
import { RNBW_STAKING_DEPOSIT_CONFIG } from '@/features/rnbw-staking/depositConfig';
import { DepositScreen } from '@/systems/funding/components/DepositScreen';

export const RnbwStakingScreen = memo(function RnbwStakingScreen() {
  return (
    <DepositScreen
      config={RNBW_STAKING_DEPOSIT_CONFIG}
      theme={{
        accent: '#E3A700',
        backgroundDark: '#090909',
        backgroundLight: '#FFFFFF',
      }}
    />
  );
});
