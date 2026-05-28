import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import { encodeFunctionData, type Address, type Hash, type Hex } from 'viem';

import { analytics } from '@/analytics';
import type { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/features/gas/types/gas';
import { mulWorklet, subWorklet } from '@/framework/core/safeMath';
import { getProvider } from '@/handlers/web3';
import { convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { extractReplayableExecution } from '@/raps/replay';
import { addNewTransaction } from '@/state/pendingTransactions';

import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS, STAKING_UNSTAKE_GAS_LIMIT } from '../constants';
import { useStakingPositionStore, type StakingPositionData } from '../stores/rnbwStakingPositionStore';
import { buildUnstakeTransaction } from './buildUnstakeTransaction';
import { pollForStakingUpdate } from './pollForStakingUpdate';
import { waitForWalletTransactions } from './waitForWalletTransactions';

type UnstakeAnalyticsSnapshot = {
  stakedAmount: string;
  expectedExitFee: string;
  expectedReceiveAmount: string;
  pnl: string;
};

type UnstakeRnbwResult = {
  txHash: Hash;
  waitForConfirmation: () => Promise<void>;
};

export async function unstakeRnbw({
  address,
  gasParams,
}: {
  address: Address;
  gasParams: LegacyTransactionGasParamAmounts | TransactionGasParamAmounts;
}): Promise<UnstakeRnbwResult> {
  const positionData = await refreshAndValidatePosition();
  const analyticsSnapshot = snapshotUnstakeAnalytics(positionData);

  try {
    const { provider, txHash } = await submitUnstake({
      address,
      gasParams,
      positionData,
    });

    return {
      txHash,
      waitForConfirmation: () => finalizeSubmittedUnstake({ analyticsSnapshot, positionData, provider, txHash }),
    };
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

async function submitUnstake({
  address,
  gasParams,
  positionData,
}: {
  address: Address;
  gasParams: LegacyTransactionGasParamAmounts | TransactionGasParamAmounts;
  positionData: StakingPositionData;
}): Promise<{ provider: StaticJsonRpcProvider; txHash: Hash }> {
  const provider = getProvider({ chainId: STAKING_CHAIN_ID });
  const signer = await loadWallet({ address, provider });
  if (!signer) {
    throw new Error('Failed to load wallet');
  }

  const data = encodeFunctionData({ abi: STAKING_ABI, functionName: 'unstakeAll' });
  const gasLimit = await estimateUnstakeGasLimit({ address, data, provider });
  const transaction = await signer.sendTransaction({
    ...gasParams,
    to: STAKING_CONTRACT_ADDRESS,
    data,
    gasLimit,
  });
  const { receiveRaw } = computeUnstakeAmounts(positionData);

  const submittedUnstake = extractReplayableExecution(tx, {
    to: STAKING_CONTRACT_ADDRESS,
    data,
    value: 0,
  });
  if (!submittedUnstake) {
    throw new RainbowError('[executeUnstakeRnbw]: manual unstaking did not return replayable transaction metadata');
  }

  addNewTransaction({
    address,
    chainId: STAKING_CHAIN_ID,
    transaction: {
      ...buildUnstakeTransaction({ address, unstakeAmountRaw: receiveRaw }),
      ...submittedUnstake.replayableCall,
      gasLimit: tx.gasLimit ?? gasLimit,
      gasPrice: tx.gasPrice,
      hash: submittedUnstake.hash,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      nonce: submittedUnstake.nonce,
    },
  });

  return { provider, txHash: tx.hash as Hash };
}

async function finalizeSubmittedUnstake({
  analyticsSnapshot,
  positionData,
  provider,
  txHash,
}: {
  analyticsSnapshot: UnstakeAnalyticsSnapshot;
  positionData: StakingPositionData;
  provider: StaticJsonRpcProvider;
  txHash: Hash;
}): Promise<void> {
  try {
    await waitForWalletTransactions({ provider, txHashes: [txHash] });
    await pollForStakingUpdate(positionData.poolShares);
    analytics.track(analytics.event.rnbwStakingUnstake, {
      chainId: STAKING_CHAIN_ID,
      txHash,
      ...analyticsSnapshot,
    });
  } catch (error) {
    analytics.track(analytics.event.rnbwStakingUnstakeFailed, {
      chainId: STAKING_CHAIN_ID,
      stakedAmount: analyticsSnapshot.stakedAmount,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
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
  const { stakedRnbw: stakedRnbwRaw, decimals, sessionPnl } = positionData;
  const { receiveRaw, exitFeeRaw } = computeUnstakeAmounts(positionData);

  return {
    stakedAmount: convertRawAmountToDecimalFormat(stakedRnbwRaw, decimals),
    expectedExitFee: convertRawAmountToDecimalFormat(exitFeeRaw, decimals),
    expectedReceiveAmount: convertRawAmountToDecimalFormat(receiveRaw, decimals),
    pnl: convertRawAmountToDecimalFormat(subWorklet(sessionPnl.exchangeRateGain, exitFeeRaw), decimals),
  };
}

function computeUnstakeAmounts(positionData: StakingPositionData): { exitFeeRaw: string; receiveRaw: string } {
  const { stakedRnbw, exitFeePercentage } = positionData;
  const exitFeeRaw = mulWorklet(stakedRnbw, exitFeePercentage / 100);
  return { exitFeeRaw, receiveRaw: subWorklet(stakedRnbw, exitFeeRaw) };
}
