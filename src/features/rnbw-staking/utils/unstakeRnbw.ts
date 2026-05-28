import { type Address } from 'viem';

import { analytics } from '@/analytics';
import type { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/features/gas/types/gas';
import { mulWorklet, subWorklet } from '@/framework/core/safeMath';
import { getProvider } from '@/handlers/web3';
import { convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';

import { STAKING_CHAIN_ID } from '../constants';
import { useStakingPositionStore, type StakingPositionData } from '../stores/rnbwStakingPositionStore';
import { executeUnstakeRnbw, type UnstakeRnbwExecution } from './executeUnstakeRnbw';
import { pollForStakingUpdate } from './pollForStakingUpdate';

type UnstakeAnalyticsSnapshot = {
  stakedAmount: string;
  expectedExitFee: string;
  expectedReceiveAmount: string;
  receiveRaw: string;
  pnl: string;
};

type UnstakeRnbwResult = {
  txHash: string;
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
  const { receiveRaw, ...analyticsSnapshot } = snapshotUnstakeAnalytics(positionData);

  try {
    const provider = getProvider({ chainId: STAKING_CHAIN_ID });
    const signer = await loadWallet({ address, provider });
    if (!signer) {
      throw new Error('Failed to load wallet');
    }

    const execution = await executeUnstakeRnbw({
      address,
      expectedReceiveAmountRaw: receiveRaw,
      gasParams,
      provider,
      signer,
    });

    return {
      txHash: execution.txHash,
      waitForConfirmation: () => finalizeSubmittedUnstake({ analyticsSnapshot, execution, positionData }),
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

  if (!positionData || positionData.exitFeePercentage === undefined) {
    throw new RainbowError('[unstakeRnbw]: Position data missing');
  }

  if (initialExitFeePercentage !== positionData.exitFeePercentage) {
    throw new RainbowError('[unstakeRnbw]: Exit fee percentage changed');
  }

  return positionData;
}

async function finalizeSubmittedUnstake({
  analyticsSnapshot,
  execution,
  positionData,
}: {
  analyticsSnapshot: Omit<UnstakeAnalyticsSnapshot, 'receiveRaw'>;
  execution: UnstakeRnbwExecution;
  positionData: StakingPositionData;
}): Promise<void> {
  try {
    await execution.waitForConfirmation();
    await pollForStakingUpdate(positionData.poolShares);
    analytics.track(analytics.event.rnbwStakingUnstake, {
      chainId: STAKING_CHAIN_ID,
      txHash: execution.txHash,
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

function snapshotUnstakeAnalytics(positionData: StakingPositionData): UnstakeAnalyticsSnapshot {
  const { stakedRnbw: stakedRnbwRaw, decimals, sessionPnl } = positionData;
  const { receiveRaw, exitFeeRaw } = computeUnstakeAmounts(positionData);

  return {
    stakedAmount: convertRawAmountToDecimalFormat(stakedRnbwRaw, decimals),
    expectedExitFee: convertRawAmountToDecimalFormat(exitFeeRaw, decimals),
    receiveRaw,
    expectedReceiveAmount: convertRawAmountToDecimalFormat(receiveRaw, decimals),
    pnl: convertRawAmountToDecimalFormat(subWorklet(sessionPnl.exchangeRateGain, exitFeeRaw), decimals),
  };
}

function computeUnstakeAmounts(positionData: StakingPositionData): { exitFeeRaw: string; receiveRaw: string } {
  const { stakedRnbw, exitFeePercentage } = positionData;
  const exitFeeRaw = mulWorklet(stakedRnbw, exitFeePercentage / 100);
  return { exitFeeRaw, receiveRaw: subWorklet(stakedRnbw, exitFeeRaw) };
}
