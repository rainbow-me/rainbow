import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';
import { useStakingPositionStore } from '@/features/rnbw-staking/stores/rnbwStakingPositionStore';
import { divWorklet, subWorklet, toFixedWorklet } from '@/framework/core/safeMath';
import { RNBW_DECIMALS } from '@/features/rnbw-staking/constants';
import { convertBipsToPercentage, convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { formatNumber } from '@/helpers/strings';
import type { Tier } from '@/features/rnbw-membership/types';

type MembershipTierInfo = {
  currentTier: Tier;
  stakeRequiredForNextTier: string;
  cashbackPercentage: string;
  currentTierProgress: number;
};

const EMPTY_TIER: MembershipTierInfo = {
  currentTier: {
    level: 'STAKING_TIER_LEVEL_BASIC',
    name: 'Basic',
    cashbackBps: 1_000,
    minStakeAmount: '0',
  },
  stakeRequiredForNextTier: '0',
  cashbackPercentage: '10%',
  currentTierProgress: 0,
};

export const useMembershipTierInfo = createDerivedStore<MembershipTierInfo>(
  $ => {
    const data = $(useStakingPositionStore, state => state.getData());

    if (!data) {
      return EMPTY_TIER;
    }

    const { tier: currentTier, allTiers, stakedRnbw } = data;

    const currentTierIndex = allTiers.findIndex(t => t.level === currentTier.level);
    const nextTierIndex = currentTierIndex + 1;
    const nextTier = nextTierIndex < allTiers.length ? allTiers[nextTierIndex] : null;

    const stakeRequiredForNextTierRaw = nextTier ? subWorklet(nextTier.minStakeAmount, stakedRnbw) : '0';
    const stakeRequiredForNextTier = formatNumber(convertRawAmountToDecimalFormat(stakeRequiredForNextTierRaw, RNBW_DECIMALS));
    const cashbackPercentage = convertBipsToPercentage(currentTier.cashbackBps, 0);
    const stakedAboveCurrentTier = subWorklet(stakedRnbw, currentTier.minStakeAmount);
    const currentTierRange = subWorklet(nextTier?.minStakeAmount ?? currentTier.minStakeAmount, currentTier.minStakeAmount);
    const currentTierProgress = nextTier ? Number(toFixedWorklet(divWorklet(stakedAboveCurrentTier, currentTierRange), 3)) : 1;

    return {
      currentTier,
      stakeRequiredForNextTier,
      cashbackPercentage,
      currentTierProgress,
    };
  },
  { equalityFn: shallowEqual, fastMode: true }
);
