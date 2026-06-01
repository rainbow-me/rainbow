import type { Signer } from '@ethersproject/abstract-signer';
import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import { encodeFunctionData, type Address, type Hex } from 'viem';

import type { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/features/gas/types/gas';
import { RainbowError } from '@/logger';
import { extractReplayableExecution } from '@/raps/replay';
import { addNewTransaction } from '@/state/pendingTransactions';

import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS, STAKING_UNSTAKE_GAS_LIMIT } from '../constants';
import { buildUnstakeTransaction } from './buildUnstakeTransaction';
import { waitForWalletTransactions } from './waitForWalletTransactions';

// ============ Types ========================================================= //

/** Submitted unstaking execution plus the confirmation waiter for its lane. */
export type UnstakeRnbwExecution = {
  executionMode: 'manual';
  txHash: string;
  waitForConfirmation: () => Promise<void>;
};

type ExecuteUnstakeRnbwParams = {
  address: Address;
  expectedReceiveAmountRaw: string;
  gasParams: LegacyTransactionGasParamAmounts | TransactionGasParamAmounts;
  provider: StaticJsonRpcProvider;
  signer: Signer;
};

// ============ Execution ===================================================== //

/**
 * Executes the RNBW unstakeAll call.
 */
export async function executeUnstakeRnbw({
  address,
  expectedReceiveAmountRaw,
  gasParams,
  provider,
  signer,
}: ExecuteUnstakeRnbwParams): Promise<UnstakeRnbwExecution> {
  return executeManualUnstakeRnbw({ address, expectedReceiveAmountRaw, gasParams, provider, signer });
}

// ============ Local Helpers ================================================= //

async function executeManualUnstakeRnbw({
  address,
  expectedReceiveAmountRaw,
  gasParams,
  provider,
  signer,
}: {
  address: Address;
  expectedReceiveAmountRaw: string;
  gasParams: LegacyTransactionGasParamAmounts | TransactionGasParamAmounts;
  provider: StaticJsonRpcProvider;
  signer: Signer;
}): Promise<UnstakeRnbwExecution> {
  const data = encodeFunctionData({ abi: STAKING_ABI, functionName: 'unstakeAll' });
  const gasLimit = await estimateUnstakeGasLimit({ address, data, provider });
  const transaction = await signer.sendTransaction({
    ...gasParams,
    to: STAKING_CONTRACT_ADDRESS,
    data,
    gasLimit,
  });

  const submittedUnstake = extractReplayableExecution(transaction);
  if (!submittedUnstake) {
    throw new RainbowError('[executeUnstakeRnbw]: manual unstaking did not return replayable transaction metadata');
  }

  addNewTransaction({
    address,
    chainId: STAKING_CHAIN_ID,
    transaction: {
      ...buildUnstakeTransaction({ address, unstakeAmountRaw: expectedReceiveAmountRaw }),
      ...submittedUnstake.replayableCall,
      hash: submittedUnstake.hash,
      gasLimit: transaction.gasLimit ?? gasLimit,
      gasPrice: transaction.gasPrice,
      maxFeePerGas: transaction.maxFeePerGas,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
      nonce: submittedUnstake.nonce,
    },
  });

  return {
    executionMode: 'manual',
    txHash: transaction.hash,
    waitForConfirmation: () => waitForWalletTransactions({ provider, txHashes: [transaction.hash] }),
  };
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
