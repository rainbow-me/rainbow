import { encodeFunctionData, type Address, type Hash } from 'viem';
import { getProvider } from '@/handlers/web3';
import { loadWallet } from '@/model/wallet';
import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS, UNSTAKE_PENALTY_PERCENTAGE } from '../constants';
import { type StakingPositionData, useStakingPositionStore } from '../stores/rnbwStakingPositionStore';
import { pollForStakingUpdate } from './pollForStakingUpdate';
import { analytics } from '@/analytics';
import { mulWorklet, subWorklet } from '@/framework/core/safeMath';
import { convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { RainbowError } from '@/logger';

export async function unstakeRnbw({ address }: { address: Address }): Promise<Hash> {
  const positionData = useStakingPositionStore.getState().getData();
  if (!positionData) {
    throw new RainbowError('[unstakeRnbw]: Position data missing');
  }
  const positionSnapshot = snapshotUnstakeAnalytics(positionData);

  try {
    const provider = getProvider({ chainId: STAKING_CHAIN_ID });
    const signer = await loadWallet({ address, provider });
    if (!signer) {
      throw new Error('Failed to load wallet');
    }

    const originalStakedRnbwShares = positionData.poolShares;
    const data = encodeFunctionData({ abi: STAKING_ABI, functionName: 'unstakeAll' });

    const tx = await signer.sendTransaction({
      to: STAKING_CONTRACT_ADDRESS,
      data,
    });

    await tx.wait();
    await pollForStakingUpdate(originalStakedRnbwShares);

    analytics.track(analytics.event.rnbwStakingUnstake, {
      chainId: STAKING_CHAIN_ID,
      txHash: tx.hash as string,
      ...positionSnapshot,
    });

    return tx.hash as Hash;
  } catch (error) {
    analytics.track(analytics.event.rnbwStakingUnstakeFailed, {
      chainId: STAKING_CHAIN_ID,
      stakedAmount: positionSnapshot.stakedAmount,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

function snapshotUnstakeAnalytics(positionData: StakingPositionData) {
  const { stakedRnbw: stakedRnbwRaw, decimals, sessionPnl } = positionData;
  const exitFeeRaw = mulWorklet(stakedRnbwRaw, UNSTAKE_PENALTY_PERCENTAGE / 100);

  return {
    stakedAmount: convertRawAmountToDecimalFormat(stakedRnbwRaw, decimals),
    expectedExitFee: convertRawAmountToDecimalFormat(exitFeeRaw, decimals),
    expectedReceiveAmount: convertRawAmountToDecimalFormat(subWorklet(stakedRnbwRaw, exitFeeRaw), decimals),
    pnl: convertRawAmountToDecimalFormat(subWorklet(sessionPnl.exchangeRateGain, exitFeeRaw), decimals),
  };
}
