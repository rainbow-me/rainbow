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
import { greaterThanOrEqualToWorklet } from '@/framework/core/safeMath';

export async function stakeRnbw({ address, amount }: { address: Address; amount: string }): Promise<Hash> {
  const provider = getProvider({ chainId: STAKING_CHAIN_ID });
  const signer = await loadWallet({ address, provider });
  if (!signer) {
    throw new Error('Failed to load wallet');
  }

  const rnbwBalanceRaw = BigInt(
    await provider.call({
      to: RNBW_TOKEN_ADDRESS,
      data: encodeFunctionData({ abi: erc20Abi, functionName: 'balanceOf', args: [address] }),
    })
  ).toString();

  const stakeAmountRaw = parseUnits(amount, RNBW_DECIMALS).toString();

  /**
   * This check is not strictly necessary, as the provider gas estimation will fail if the balance is insufficient.
   * However, the error returned by the provider in that case is opaque.
   */
  const hasSufficientBalance = greaterThanOrEqualToWorklet(rnbwBalanceRaw, stakeAmountRaw);
  if (!hasSufficientBalance) {
    throw new RainbowError('[stakeRnbw]: Insufficient balance');
  }
  const isRainbowDelegated = await isRainbowDelegatedForChain(address, STAKING_CHAIN_ID);

  await claimRnbwRewards({ address, signer });

  const originalStakedRnbwShares = useStakingPositionStore.getState().getData()?.poolShares ?? '0';

  const transactionHash: Hash = isRainbowDelegated
    ? await stakeRnbwSponsored({ signer, address, provider, stakeAmountRaw })
    : await stakeRnbwManual({ signer, address, provider, stakeAmountRaw });

  await pollForStakingUpdate(originalStakedRnbwShares);

  // TODO: For testing. Remove
  Alert.alert(`Staked: ${amount} RNBW (${isRainbowDelegated ? 'Sponsored' : 'Manual'})`, transactionHash);
  return transactionHash;
}

async function claimRnbwRewards({ address, signer }: { address: Address; signer: Signer }): Promise<void> {
  await useRewardsBalanceStore.getState().fetch(undefined, { force: true });
  const hasClaimable = useRewardsBalanceStore.getState().hasClaimableRewards();
  const hasPendingClaim = useRewardsBalanceStore.getState().getData()?.hasPendingClaim;

  if (!hasClaimable || hasPendingClaim) return;

  const currency = userAssetsStoreManager.getState().currency;
  const preparedClaim = await prepareRewardsClaim({ address, signer });
  await submitRewardsClaim({ preparedClaim, currency });
}
