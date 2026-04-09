import { createDerivedStore, shallowEqual } from '@storesjs/stores';
import { useStakingPositionStore } from '@/features/rnbw-staking/stores/rnbwStakingPositionStore';
import { divWorklet, subWorklet, toFixedWorklet } from '@/framework/core/safeMath';
import { RNBW_DECIMALS } from '@/features/rnbw-staking/constants';
import { convertBipsToPercentage, convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { formatNumber } from '@/helpers/strings';
import type { Tier } from '@/features/rnbw-membership/types';
import { FALLBACK_TIERS } from '@/features/rnbw-membership/constants';

type MembershipTierInfo = {
  currentTier: Tier;
  stakeRequiredForNextTier: string;
  cashbackPercentage: number;
  currentTierProgress: number;
  allTiers: Tier[];
  currentTierIndex: number;
  maxTierProgress: number;
};

const EMPTY_TIER: MembershipTierInfo = {
  currentTier: FALLBACK_TIERS[0],
  stakeRequiredForNextTier: '0',
  cashbackPercentage: 10,
  currentTierProgress: 0,
  allTiers: FALLBACK_TIERS,
  currentTierIndex: 0,
  maxTierProgress: 0,
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
    const maxTier = allTiers[allTiers.length - 1];

    const stakeRequiredForNextTierRaw = nextTier ? subWorklet(nextTier.minStakeAmount, stakedRnbw) : '0';
    const stakeRequiredForNextTier = formatNumber(convertRawAmountToDecimalFormat(stakeRequiredForNextTierRaw, RNBW_DECIMALS));
    const cashbackPercentage = Number(convertBipsToPercentage(currentTier.cashbackBps, 0));
    const stakedAboveCurrentTier = subWorklet(stakedRnbw, currentTier.minStakeAmount);
    const currentTierRange = subWorklet(nextTier?.minStakeAmount ?? currentTier.minStakeAmount, currentTier.minStakeAmount);
    const currentTierProgress = nextTier ? Number(toFixedWorklet(divWorklet(stakedAboveCurrentTier, currentTierRange), 3)) : 1;
    const maxTierProgress = Math.min(1, Number(divWorklet(stakedRnbw, maxTier.minStakeAmount)));

    return {
      currentTier,
      stakeRequiredForNextTier,
      cashbackPercentage,
      currentTierProgress,
      allTiers,
      currentTierIndex,
      maxTierProgress,
    };
  },
  { equalityFn: shallowEqual, lockDependencies: true }
);
