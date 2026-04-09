import type { Signer } from '@ethersproject/abstract-signer';
import { encodeFunctionData, erc20Abi, formatUnits, parseUnits, type Address, type Hash } from 'viem';

import { analytics } from '@/analytics';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { prepareRewardsClaim, submitRewardsClaim, type ClaimToDestination } from '@/features/rnbw-rewards/utils/claimRewards';
import { equalWorklet, greaterThanOrEqualToWorklet, isPositive, subWorklet } from '@/framework/core/safeMath';
import { getProvider } from '@/handlers/web3';
import { RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { MIN_CLAIM_TO_STAKING_RAW, RNBW_DECIMALS, RNBW_TOKEN_ADDRESS, STAKING_CHAIN_ID } from '../constants';
import { useStakingPositionStore } from '../stores/rnbwStakingPositionStore';
import { canUseSponsoredRnbwStaking } from './canUseSponsoredRnbwStaking';
import { pollForStakingUpdate } from './pollForStakingUpdate';
import { stakeRnbwManual } from './stakeRnbwManual';
import { stakeRnbwSponsored } from './stakeRnbwSponsored';

export async function stakeRnbw({ address, amount }: { address: Address; amount: string }) {
  let claimToDestination: ClaimToDestination | undefined;
  let claimFulfillsStake: boolean | undefined;
  let executionMode: 'sponsored' | 'manual' | 'claim_only' | undefined;

  try {
    const provider = getProvider({ chainId: STAKING_CHAIN_ID });
    const signer = await loadWallet({ address, provider });
    if (!signer) {
      throw new Error('Failed to load wallet');
    }

    const stakeAmountRaw = parseUnits(amount, RNBW_DECIMALS).toString();
    const claimStrategy = await resolveClaimStrategy(stakeAmountRaw);
    claimToDestination = claimStrategy.claimToDestination;
    claimFulfillsStake = claimStrategy.claimFulfillsStake;
    const { requiredWalletBalanceRaw, walletStakeAmountRaw } = claimStrategy;
    const amountFromWallet = formatUnits(BigInt(requiredWalletBalanceRaw), RNBW_DECIMALS);
    const amountFromRewards = subWorklet(amount, amountFromWallet);

    if (isPositive(requiredWalletBalanceRaw)) {
      const rnbwBalanceRaw = BigInt(
        await provider.call({
          to: RNBW_TOKEN_ADDRESS,
          data: encodeFunctionData({ abi: erc20Abi, functionName: 'balanceOf', args: [address] }),
        })
      ).toString();

      /**
       * This check is not strictly necessary, as the provider gas estimation will fail if the balance is insufficient.
       * However, the error returned by the provider in that case is opaque.
       */
      const hasSufficientBalance = greaterThanOrEqualToWorklet(rnbwBalanceRaw, requiredWalletBalanceRaw);
      if (!hasSufficientBalance) {
        throw new RainbowError('[stakeRnbw]: Insufficient balance');
      }
    }

    const canUseSponsoredStaking = await canUseSponsoredRnbwStaking(address, STAKING_CHAIN_ID);
    const originalStakedRnbwShares = useStakingPositionStore.getState().getData()?.poolShares ?? '0';

    await claimRnbwRewards({ address, signer, claimToDestination });

    if (claimFulfillsStake) {
      await pollForStakingUpdate(originalStakedRnbwShares);

      analytics.track(analytics.event.rnbwStakingStake, {
        chainId: STAKING_CHAIN_ID,
        amount,
        amountFromWallet,
        amountFromRewards,
        executionMode: 'claim_only',
        claimToDestination,
        claimFulfillsStake,
      });
      return;
    }

    /**
     * Re-snapshot shares after the claim so the final poll baseline reflects the claim-to-staking.
     * Without this, the poll would resolve as soon as the claim is indexed, before the wallet stake is reflected.
     */
    await useStakingPositionStore.getState().fetch(undefined, { force: true });
    const postClaimShares = useStakingPositionStore.getState().getData()?.poolShares ?? originalStakedRnbwShares;

    executionMode = canUseSponsoredStaking ? 'sponsored' : 'manual';
    canUseSponsoredStaking
      ? await stakeRnbwSponsored({ address, provider, stakeAmountRaw: walletStakeAmountRaw, signer })
      : await stakeRnbwManual({ address, provider, stakeAmountRaw: walletStakeAmountRaw, signer });

    await pollForStakingUpdate(postClaimShares);

    analytics.track(analytics.event.rnbwStakingStake, {
      chainId: STAKING_CHAIN_ID,
      amount,
      amountFromWallet,
      amountFromRewards,
      executionMode,
      claimToDestination,
      claimFulfillsStake,
    });
  } catch (error) {
    analytics.track(analytics.event.rnbwStakingStakeFailed, {
      chainId: STAKING_CHAIN_ID,
      amount,
      executionMode,
      claimToDestination,
      claimFulfillsStake,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function claimRnbwRewards({
  address,
  signer,
  claimToDestination,
}: {
  address: Address;
  signer: Signer;
  claimToDestination: ClaimToDestination;
}): Promise<Hash | undefined> {
  const hasClaimable = useRewardsBalanceStore.getState().hasClaimableRewards();
  const hasPendingClaim = useRewardsBalanceStore.getState().getData()?.hasPendingClaim;

  if (!hasClaimable || hasPendingClaim) return undefined;

  const currency = userAssetsStoreManager.getState().currency;
  const preparedClaim = await prepareRewardsClaim({ address, signer });
  await submitRewardsClaim({ preparedClaim, currency, claimToDestination });
}

async function resolveClaimStrategy(stakeAmountRaw: string): Promise<{
  claimToDestination: ClaimToDestination;
  requiredWalletBalanceRaw: string;
  walletStakeAmountRaw: string;
  claimFulfillsStake: boolean;
}> {
  await useRewardsBalanceStore.getState().fetch(undefined, { force: true });
  const claimableRnbw = useRewardsBalanceStore.getState().getData()?.claimableRnbw ?? '0';
  const hasClaimable = useRewardsBalanceStore.getState().hasClaimableRewards();
  const canOffsetWithClaim = hasClaimable && greaterThanOrEqualToWorklet(stakeAmountRaw, claimableRnbw);
  const claimToStaking = canOffsetWithClaim && greaterThanOrEqualToWorklet(claimableRnbw, MIN_CLAIM_TO_STAKING_RAW);

  /**
   * The claim always executes before the stake tx, so any claimable rewards — whether routed
   * to staking or to the wallet — reduce the wallet balance the user needs up front.
   */
  const requiredWalletBalanceRaw = canOffsetWithClaim ? subWorklet(stakeAmountRaw, claimableRnbw) : stakeAmountRaw;

  /**
   * When claiming to staking, the claimed tokens go directly to the staking contract,
   * so only the remainder needs to be staked from the wallet.
   * When claiming to wallet, the full stake amount is pulled from the wallet (which
   * now includes the claimed tokens).
   */
  const walletStakeAmountRaw = claimToStaking ? subWorklet(stakeAmountRaw, claimableRnbw) : stakeAmountRaw;

  return {
    claimToDestination: claimToStaking ? 'staking' : 'wallet',
    requiredWalletBalanceRaw,
    walletStakeAmountRaw,
    claimFulfillsStake: claimToStaking && equalWorklet(stakeAmountRaw, claimableRnbw),
  };
}
