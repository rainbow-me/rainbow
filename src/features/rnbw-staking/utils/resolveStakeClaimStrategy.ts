import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { type ClaimToDestination } from '@/features/rnbw-rewards/utils/claimRewards';
import { equalWorklet, greaterThanOrEqualToWorklet, subWorklet } from '@/framework/core/safeMath';

import { MIN_CLAIM_TO_STAKING_RAW } from '../constants';

// ============ Types ========================================================= //

/** Claim routing and wallet-funded stake amount derived from current rewards state. */
export type StakeClaimStrategy = {
  claimFulfillsStake: boolean;
  claimToDestination: ClaimToDestination;
  requiredWalletBalanceRaw: string;
  walletStakeAmountRaw: string;
};

// ============ Claim Strategy ================================================ //

/**
 * Resolves how claimable rewards affect wallet balance requirements and stake calldata.
 */
export async function resolveStakeClaimStrategy(stakeAmountRaw: string): Promise<StakeClaimStrategy> {
  await useRewardsBalanceStore.getState().fetch(undefined, { force: true });
  const claimableRnbw = useRewardsBalanceStore.getState().getData()?.claimableRnbw ?? '0';
  const hasClaimable = useRewardsBalanceStore.getState().hasClaimableRewards();
  const canOffsetWithClaim = hasClaimable && greaterThanOrEqualToWorklet(stakeAmountRaw, claimableRnbw);
  const claimToStaking = canOffsetWithClaim && greaterThanOrEqualToWorklet(claimableRnbw, MIN_CLAIM_TO_STAKING_RAW);

  const requiredWalletBalanceRaw = canOffsetWithClaim ? subWorklet(stakeAmountRaw, claimableRnbw) : stakeAmountRaw;
  const walletStakeAmountRaw = claimToStaking ? subWorklet(stakeAmountRaw, claimableRnbw) : stakeAmountRaw;

  return {
    claimToDestination: claimToStaking ? 'staking' : 'wallet',
    requiredWalletBalanceRaw,
    walletStakeAmountRaw,
    claimFulfillsStake: claimToStaking && equalWorklet(stakeAmountRaw, claimableRnbw),
  };
}
