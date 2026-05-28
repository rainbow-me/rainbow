import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import { encodeFunctionData, type Address, type Hash, type Hex } from 'viem';

import { analytics } from '@/analytics';
import type { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/features/gas/types/gas';
import { mulWorklet, subWorklet } from '@/framework/core/safeMath';
import { getProvider } from '@/handlers/web3';
import { convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';

import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS, STAKING_UNSTAKE_GAS_LIMIT } from '../constants';
import { useStakingPositionStore, type StakingPositionData } from '../stores/rnbwStakingPositionStore';
import { pollForStakingUpdate } from './pollForStakingUpdate';
import { waitForWalletTransactions } from './waitForWalletTransactions';

type UnstakeAnalyticsSnapshot = {
  stakedAmount: string;
  expectedExitFee: string;
  expectedReceiveAmount: string;
  pnl: string;
};

export async function unstakeRnbw({
  address,
  gasParams,
}: {
  address: Address;
  gasParams: LegacyTransactionGasParamAmounts | TransactionGasParamAmounts;
}): Promise<Hash> {
  const positionData = await refreshAndValidatePosition();
  const analyticsSnapshot = snapshotUnstakeAnalytics(positionData);

  try {
    const txHash = await submitAndConfirmUnstake({
      address,
      gasParams,
      originalStakedRnbwShares: positionData.poolShares,
    });

    analytics.track(analytics.event.rnbwStakingUnstake, {
      chainId: STAKING_CHAIN_ID,
      txHash,
      ...analyticsSnapshot,
    });

    return txHash;
  } catch (error) {
    analytics.track(analytics.event.rnbwStakingUnstakeFailed, {
      chainId: STAKING_CHAIN_ID,
      stakedAmount: analyticsSnapshot.stakedAmount,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function refreshAndValidatePosition(): Promise<StakingPositionData> {
  const initialExitFeePercentage = useStakingPositionStore.getState().getData()?.exitFeePercentage;
  await useStakingPositionStore.getState().fetch(undefined, { force: true });
  const positionData = useStakingPositionStore.getState().getData();

  if (!positionData || !positionData.exitFeePercentage) {
    throw new RainbowError('[unstakeRnbw]: Position data missing');
  }

  if (initialExitFeePercentage !== positionData.exitFeePercentage) {
    throw new RainbowError('[unstakeRnbw]: Exit fee percentage changed');
  }

  return positionData;
}

async function submitAndConfirmUnstake({
  address,
  gasParams,
  originalStakedRnbwShares,
}: {
  address: Address;
  gasParams: LegacyTransactionGasParamAmounts | TransactionGasParamAmounts;
  originalStakedRnbwShares: string;
}): Promise<Hash> {
  const provider = getProvider({ chainId: STAKING_CHAIN_ID });
  const signer = await loadWallet({ address, provider });
  if (!signer) {
    throw new Error('Failed to load wallet');
  }

  const data = encodeFunctionData({ abi: STAKING_ABI, functionName: 'unstakeAll' });
  const gasLimit = await estimateUnstakeGasLimit({ address, data, provider });
  const tx = await signer.sendTransaction({
    ...gasParams,
    to: STAKING_CONTRACT_ADDRESS,
    data,
    gasLimit,
  });

  await waitForWalletTransactions({ provider, txHashes: [tx.hash] });
  await pollForStakingUpdate(originalStakedRnbwShares);

  return tx.hash as Hash;
}

async function estimateUnstakeGasLimit({
  address,
  data,
  provider,
}: {
  address: Address;
  data: Hex;
  provider: StaticJsonRpcProvider;
}): Promise<string> {
  try {
    const estimatedGasLimit = await provider.estimateGas({ data, from: address, to: STAKING_CONTRACT_ADDRESS });
    return estimatedGasLimit.toString();
  } catch {
    return STAKING_UNSTAKE_GAS_LIMIT.toString();
  }
}

function snapshotUnstakeAnalytics(positionData: StakingPositionData): UnstakeAnalyticsSnapshot {
  const { stakedRnbw: stakedRnbwRaw, decimals, sessionPnl, exitFeePercentage } = positionData;
  const exitFeeRaw = mulWorklet(stakedRnbwRaw, exitFeePercentage / 100);

  return {
    stakedAmount: convertRawAmountToDecimalFormat(stakedRnbwRaw, decimals),
    expectedExitFee: convertRawAmountToDecimalFormat(exitFeeRaw, decimals),
    expectedReceiveAmount: convertRawAmountToDecimalFormat(subWorklet(stakedRnbwRaw, exitFeeRaw), decimals),
    pnl: convertRawAmountToDecimalFormat(subWorklet(sessionPnl.exchangeRateGain, exitFeeRaw), decimals),
  };
}
