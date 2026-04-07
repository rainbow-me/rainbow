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

export const useMembershipTierInfo = createDerivedStore<MembershipTierInfo>(
  $ => {
    const currentTierLevel = $(useStakingPositionStore, state => state.getData()?.tier.level ?? FALLBACK_TIERS[0].level);
    const allTiers = $(useStakingPositionStore, state => state.getData()?.allTiers ?? FALLBACK_TIERS);
    const stakedRnbw = $(useStakingPositionStore, state => state.getData()?.stakedRnbw ?? '0');

    const currentTierIndex = allTiers.findIndex(t => t.level === currentTierLevel);
    const currentTier = currentTierIndex >= 0 ? allTiers[currentTierIndex] : FALLBACK_TIERS[0];
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
