import type { Signer } from '@ethersproject/abstract-signer';
import { Wallet } from '@ethersproject/wallet';
import { encodeFunctionData, erc20Abi, formatUnits, parseUnits, type Address, type Hash } from 'viem';

import { analytics } from '@/analytics';
import type { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/features/gas/types/gas';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { prepareRewardsClaim, submitRewardsClaim, type ClaimToDestination } from '@/features/rnbw-rewards/utils/claimRewards';
import { greaterThanOrEqualToWorklet, isPositive, subWorklet } from '@/framework/core/safeMath';
import { getProvider } from '@/handlers/web3';
import { RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { type TransactionAssetSource } from '@/raps/transactionAsset';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { RNBW_DECIMALS, RNBW_TOKEN_ADDRESS, STAKING_CHAIN_ID } from '../constants';
import { useStakingPositionStore } from '../stores/rnbwStakingPositionStore';
import { executeStakeRnbw, type StakeRnbwExecution } from './executeStakeRnbw';
import { pollForStakingUpdate } from './pollForStakingUpdate';
import { type PreparedStakeRnbw } from './prepareStakeRnbw';
import { resolveStakeClaimStrategy } from './resolveStakeClaimStrategy';

type StakeRnbwResult =
  | {
      isConfirmed: true;
      waitForConfirmation: undefined;
    }
  | {
      isConfirmed: false;
      waitForConfirmation: () => Promise<void>;
    };

type StakeSuccessMetadata = {
  amount: string;
  amountFromRewards: string;
  amountFromWallet: string;
  claimFulfillsStake: boolean;
  claimToDestination: ClaimToDestination;
  executionMode: 'sponsored' | 'manual' | 'claim_only';
};

/**
 * Stakes RNBW from wallet balance and claimable rewards.
 *
 * Transaction execution resolves after accepted submission and returns the
 * confirmation work for the deposit flow to run after dismissal. Claim-only
 * staking resolves after the claim is reflected in staking data.
 */
export async function stakeRnbw({
  address,
  amount,
  asset,
  gasParams,
  preparedStake: preparedStakePromise,
}: {
  address: Address;
  amount: string;
  asset: TransactionAssetSource;
  gasParams: LegacyTransactionGasParamAmounts | TransactionGasParamAmounts;
  preparedStake: Promise<PreparedStakeRnbw | null>;
}): Promise<StakeRnbwResult> {
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
    const claimStrategy = await resolveStakeClaimStrategy(stakeAmountRaw);
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

    const originalStakedRnbwShares = useStakingPositionStore.getState().getData()?.poolShares ?? '0';

    await claimRnbwRewards({ address, signer, claimToDestination });

    if (claimFulfillsStake) {
      executionMode = 'claim_only';
      await pollForStakingUpdate(originalStakedRnbwShares);

      trackStakeSuccess({
        amount,
        amountFromWallet,
        amountFromRewards,
        executionMode: 'claim_only',
        claimToDestination,
        claimFulfillsStake,
      });

      return { isConfirmed: true, waitForConfirmation: undefined };
    }

    /**
     * Re-snapshot shares after the claim so the final poll baseline reflects the claim-to-staking.
     * Without this, the poll would resolve as soon as the claim is indexed, before the wallet stake is reflected.
     */
    await useStakingPositionStore.getState().fetch(undefined, { force: true });
    const postClaimShares = useStakingPositionStore.getState().getData()?.poolShares ?? originalStakedRnbwShares;

    const resolvedPreparedStake = signer instanceof Wallet ? await preparedStakePromise : null;
    const preparedCalls = resolvedPreparedStake?.walletStakeAmountRaw === walletStakeAmountRaw ? resolvedPreparedStake.preparedCalls : null;
    const execution = await executeStakeRnbw({
      address,
      asset,
      gasParams,
      preparedCalls,
      provider,
      signer,
      stakeAmountRaw: walletStakeAmountRaw,
    });
    executionMode = execution.executionMode;

    const successMetadata: StakeSuccessMetadata = {
      amount,
      amountFromWallet,
      amountFromRewards,
      executionMode,
      claimToDestination,
      claimFulfillsStake,
    };

    return {
      isConfirmed: false,
      waitForConfirmation: () =>
        finalizeSubmittedStakeRnbw({
          execution,
          postClaimShares,
          successMetadata,
        }),
    };
  } catch (error) {
    trackStakeFailure({
      amount,
      executionMode,
      claimToDestination,
      claimFulfillsStake,
      error,
    });
    throw error;
  }
}

async function finalizeSubmittedStakeRnbw({
  execution,
  postClaimShares,
  successMetadata,
}: {
  execution: StakeRnbwExecution;
  postClaimShares: string;
  successMetadata: StakeSuccessMetadata;
}): Promise<void> {
  try {
    await execution.waitForConfirmation();
    await pollForStakingUpdate(postClaimShares);
    trackStakeSuccess(successMetadata);
  } catch (error) {
    trackStakeFailure({
      amount: successMetadata.amount,
      executionMode: successMetadata.executionMode,
      claimToDestination: successMetadata.claimToDestination,
      claimFulfillsStake: successMetadata.claimFulfillsStake,
      error,
    });
    throw error;
  }
}

function trackStakeSuccess(metadata: StakeSuccessMetadata): void {
  analytics.track(analytics.event.rnbwStakingStake, {
    chainId: STAKING_CHAIN_ID,
    ...metadata,
  });
}

function trackStakeFailure({
  amount,
  executionMode,
  claimToDestination,
  claimFulfillsStake,
  error,
}: {
  amount: string;
  executionMode?: StakeSuccessMetadata['executionMode'];
  claimToDestination?: ClaimToDestination;
  claimFulfillsStake?: boolean;
  error: unknown;
}): void {
  analytics.track(analytics.event.rnbwStakingStakeFailed, {
    chainId: STAKING_CHAIN_ID,
    amount,
    executionMode,
    claimToDestination,
    claimFulfillsStake,
    errorMessage: error instanceof Error ? error.message : 'Unknown error',
  });
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
