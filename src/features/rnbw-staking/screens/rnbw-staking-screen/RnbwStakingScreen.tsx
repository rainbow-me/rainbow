import React, { memo } from 'react';

import { destroyStore } from '@storesjs/stores';

import { createPreparedCallsStore } from '@/features/delegation/preparedCallsStore';
import { createRnbwStakingDepositConfig } from '@/features/rnbw-staking/depositConfig';
import { prepareStakeRnbw } from '@/features/rnbw-staking/utils/prepareStakeRnbw';
import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import { DepositScreen } from '@/systems/funding/components/DepositScreen';

export const RnbwStakingScreen = memo(function RnbwStakingScreen() {
  const stakePreparationStore = useStableValue(() => createPreparedCallsStore(prepareStakeRnbw));
  const config = useStableValue(() => createRnbwStakingDepositConfig(stakePreparationStore));

  useCleanup(() => {
    destroyStore(stakePreparationStore, { clearQueryCache: true });
  }, [stakePreparationStore]);

  return (
    <DepositScreen
      config={config}
      theme={{
        accent: '#E3A700',
        backgroundDark: '#090909',
        backgroundLight: '#FFFFFF',
      }}
    />
  );
});
