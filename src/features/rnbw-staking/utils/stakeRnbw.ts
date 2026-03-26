import { encodeFunctionData, erc20Abi, parseUnits, type Address, type Hash } from 'viem';
import { stakeRnbwManual } from './stakeRnbwManual';
import { stakeRnbwSponsored } from './stakeRnbwSponsored';
import { getProvider } from '@/handlers/web3';
import { loadWallet } from '@/model/wallet';
import { DelegationStatus, getDelegations } from '@rainbow-me/delegation';
import { RNBW_DECIMALS, RNBW_TOKEN_ADDRESS, STAKING_CHAIN_ID } from '../constants';
import { useStakingPositionStore } from '../stores/rnbwStakingPositionStore';
import { pollForStakingUpdate } from './pollForStakingUpdate';
import { RainbowError } from '@/logger';
import type { Signer } from '@ethersproject/abstract-signer';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { prepareRewardsClaim, submitRewardsClaim, type ClaimToDestination } from '@/features/rnbw-rewards/utils/claimRewards';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

export async function stakeRnbw({ address, amount }: { address: Address; amount: string }): Promise<Hash> {
  const provider = getProvider({ chainId: STAKING_CHAIN_ID });
  const signer = await loadWallet({ address, provider });
  if (!signer) {
    throw new Error('Failed to load wallet');
  }

  const rnbwBalance = await provider.call({
    to: RNBW_TOKEN_ADDRESS,
    data: encodeFunctionData({ abi: erc20Abi, functionName: 'balanceOf', args: [address] }),
  });

  /**
   * This check is not strictly necessary, as the provider gas estimation will fail if the balance is insufficient.
   * However, the error returned by the provider in that case is opaque.
   */
  const hasSufficientBalance = BigInt(rnbwBalance) >= BigInt(amount);
  if (!hasSufficientBalance) {
    throw new RainbowError('[stakeRnbw]: Insufficient balance');
  }

  const stakeAmountRaw = parseUnits(amount, RNBW_DECIMALS).toString();
  const delegations = await getDelegations({ address });
  const chainDelegation = delegations.find(delegation => delegation.chainId === STAKING_CHAIN_ID);
  const isRainbowDelegated = chainDelegation?.delegationStatus === DelegationStatus.RAINBOW_DELEGATED;

  /**
   * TODO: Add the claim-to-stake flow
   * The flow will be the same as claimRewards but targeting the
   * StakeRewards endpoint that deposits directly into the staking contract.
   */
  await claimRnbwRewards({ address, signer, claimToDestination: 'wallet' });

  const originalStakedRnbwShares = useStakingPositionStore.getState().getData()?.poolShares ?? '0';

  const transactionHash: Hash = isRainbowDelegated
    ? await stakeRnbwSponsored({ address, provider, stakeAmountRaw, signer })
    : await stakeRnbwManual({ address, provider, stakeAmountRaw, signer });

  await pollForStakingUpdate(originalStakedRnbwShares);

  return transactionHash;
}

async function claimRnbwRewards({
  address,
  signer,
  claimToDestination,
}: {
  address: Address;
  signer: Signer;
  claimToDestination: ClaimToDestination;
}): Promise<void> {
  await useRewardsBalanceStore.getState().fetch(undefined, { force: true });
  const hasClaimable = useRewardsBalanceStore.getState().hasClaimableRewards();
  const hasPendingClaim = useRewardsBalanceStore.getState().getData()?.hasPendingClaim;

  if (!hasClaimable || hasPendingClaim) return;

  const currency = userAssetsStoreManager.getState().currency;
  const preparedClaim = await prepareRewardsClaim({ address, signer });
  await submitRewardsClaim({ preparedClaim, currency, claimToDestination });
}
