import { encodeFunctionData, erc20Abi, parseUnits, type Address, type Hash } from 'viem';
import { stakeRnbwManual } from './stakeRnbwManual';
import { stakeRnbwSponsored } from './stakeRnbwSponsored';
import { getProvider } from '@/handlers/web3';
import { loadWallet } from '@/model/wallet';
import { RNBW_DECIMALS, RNBW_TOKEN_ADDRESS, STAKING_CHAIN_ID } from '../constants';
import { useStakingPositionStore } from '../stores/rnbwStakingPositionStore';
import { pollForStakingUpdate } from './pollForStakingUpdate';
import { RainbowError } from '@/logger';
import type { Signer } from '@ethersproject/abstract-signer';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { prepareRewardsClaim, submitRewardsClaim } from '@/features/rnbw-rewards/utils/claimRewards';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { isRainbowDelegatedForChain } from '@/features/delegation/utils/isRainbowDelegatedForChain';
import { Alert } from 'react-native';
import { equalWorklet, greaterThanOrEqualToWorklet, isPositive, subWorklet } from '@/framework/core/safeMath';
import type { ClaimToDestination } from '@/features/rnbw-rewards/utils/claimRewards';

export async function stakeRnbw({ address, amount }: { address: Address; amount: string }) {
  const provider = getProvider({ chainId: STAKING_CHAIN_ID });
  const signer = await loadWallet({ address, provider });
  if (!signer) {
    throw new Error('Failed to load wallet');
  }

  const stakeAmountRaw = parseUnits(amount, RNBW_DECIMALS).toString();
  const { claimToDestination, requiredWalletBalanceRaw, claimFulfillsStake } = await resolveClaimStrategy(stakeAmountRaw);

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

  const isRainbowDelegated = await isRainbowDelegatedForChain(address, STAKING_CHAIN_ID);
  const originalStakedRnbwShares = useStakingPositionStore.getState().getData()?.poolShares ?? '0';

  await claimRnbwRewards({ address, signer, claimToDestination });

  if (claimFulfillsStake) {
    await pollForStakingUpdate(originalStakedRnbwShares);
    return;
  }

  /**
   * Re-snapshot shares after the claim so the final poll baseline reflects the claim-to-staking.
   * Without this, the poll would resolve as soon as the claim is indexed, before the wallet stake is reflected.
   */
  await useStakingPositionStore.getState().fetch(undefined, { force: true });
  const postClaimShares = useStakingPositionStore.getState().getData()?.poolShares ?? originalStakedRnbwShares;

  isRainbowDelegated
    ? await stakeRnbwSponsored({ address, provider, stakeAmountRaw: requiredWalletBalanceRaw, signer })
    : await stakeRnbwManual({ address, provider, stakeAmountRaw: requiredWalletBalanceRaw, signer });

  await pollForStakingUpdate(postClaimShares);
  Alert.alert(`Staked: ${amount} RNBW (${isRainbowDelegated ? 'Sponsored' : 'Manual'})`);
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
  claimFulfillsStake: boolean;
}> {
  await useRewardsBalanceStore.getState().fetch(undefined, { force: true });
  const claimableRnbw = useRewardsBalanceStore.getState().getData()?.claimableRnbw ?? '0';
  const hasClaimable = useRewardsBalanceStore.getState().hasClaimableRewards();
  const claimToStaking = hasClaimable && greaterThanOrEqualToWorklet(stakeAmountRaw, claimableRnbw);
  const requiredWalletBalanceRaw = claimToStaking ? subWorklet(stakeAmountRaw, claimableRnbw) : stakeAmountRaw;

  return {
    claimToDestination: claimToStaking ? 'staking' : 'wallet',
    requiredWalletBalanceRaw,
    claimFulfillsStake: claimToStaking && equalWorklet(stakeAmountRaw, claimableRnbw),
  };
}
