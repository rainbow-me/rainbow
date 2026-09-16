import { createDerivedStore } from '@storesjs/stores';

import { BLACK_TIER_ADD_CASH_RATE, DEFAULT_ADD_CASH_RATE } from '@/features/cash/constants';
import { FALLBACK_TIERS } from '@/features/rnbw-membership/constants';
import { useStakingPositionStore } from '@/features/rnbw-staking/stores/rnbwStakingPositionStore';

/**
 * Returns the add cash fee rate based on the current staking tier level. The fee
 * rate is a multiplier applied to the added amount (e.g., `'0.97'` for a 3% fee).
 */
export const useAddCashFee = createDerivedStore(
  $ => {
    const currentTierLevel = $(useStakingPositionStore, s => s.getData()?.tier.level ?? FALLBACK_TIERS[0].level);
    return currentTierLevel === 'STAKING_TIER_LEVEL_BLACK' ? BLACK_TIER_ADD_CASH_RATE : DEFAULT_ADD_CASH_RATE;
  },
  { lockDependencies: true }
);
