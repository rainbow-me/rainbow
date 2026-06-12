import type { TransactionResponse } from '@ethersproject/abstract-provider';
import type { Signer } from '@ethersproject/abstract-signer';
import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { type Address } from 'viem';

import { TransactionDirection, TransactionStatus, type NewTransaction } from '@/entities/transactions';
import { canUseDelegatedExecution } from '@/features/delegation/willDelegate';
import type { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/features/gas/types/gas';
import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { RainbowError } from '@/logger';
import { extractReplayableExecution } from '@/raps/replay';
import { toTransactionAsset, type TransactionAssetSource } from '@/raps/transactionAsset';
import { addNewTransaction } from '@/state/pendingTransactions';
import { type Call, type PreparedCallsExecution } from '@rainbow-me/delegation';

import {
  RNBW_TOKEN_ADDRESS,
  STAKING_APPROVAL_GAS_LIMIT,
  STAKING_CHAIN_ID,
  STAKING_CONTRACT_ADDRESS,
  STAKING_GAS_LIMIT,
} from '../constants';
import { executeRnbwStakingCalls, type RnbwStakingExecution } from './executeRnbwStakingCalls';
import { buildStakeRnbwCalls, buildStakeRnbwExecutionPlan } from './stakeRnbwCalls';
import { waitForWalletTransactions } from './waitForWalletTransactions';

// ============ Types ========================================================= //

/** Submitted staking execution plus the confirmation waiter for its lane. */
export type StakeRnbwExecution = RnbwStakingExecution;

type ExecuteStakeRnbwParams = {
  address: Address;
  asset: TransactionAssetSource;
  gasParams: LegacyTransactionGasParamAmounts | TransactionGasParamAmounts;
  preparedCalls: PreparedCallsExecution | null;
  provider: StaticJsonRpcProvider;
  signer: Signer;
  stakeAmountRaw: string;
};

// ============ Execution ===================================================== //

/**
 * Executes the RNBW approval + stake call sequence.
 */
export async function executeStakeRnbw({
  address,
  asset,
  gasParams,
  preparedCalls,
  provider,
  signer,
  stakeAmountRaw,
}: ExecuteStakeRnbwParams): Promise<StakeRnbwExecution> {
  if (!(signer instanceof Wallet) || !canUseDelegatedExecution(address)) {
    return executeSequentialStakeRnbw({ address, asset, gasParams, provider, signer, stakeAmountRaw });
  }

  return executeRnbwStakingCalls({
    address,
    buildPlan: () => buildStakeRnbwExecutionPlan({ address, provider, stakeAmountRaw }),
    errorPrefix: '[executeStakeRnbw]',
    preparedCalls,
    provider,
    signer,
    transaction: buildStakeTransaction({ address, asset, stakeAmountRaw }),
  });
}

// ============ Local Helpers ================================================= //

async function executeSequentialStakeRnbw({
  address,
  asset,
  gasParams,
  provider,
  signer,
  stakeAmountRaw,
}: {
  address: Address;
  asset: TransactionAssetSource;
  gasParams: LegacyTransactionGasParamAmounts | TransactionGasParamAmounts;
  provider: StaticJsonRpcProvider;
  signer: Signer;
  stakeAmountRaw: string;
}): Promise<StakeRnbwExecution> {
  const calls = await buildStakeRnbwCalls({ address, provider, stakeAmountRaw });
  const confirmationTxHashes: string[] = [];
  let stakeTransaction: TransactionResponse | null = null;

  for (let index = 0; index < calls.length; index++) {
    const call = calls[index];
    const isFinalCall = index === calls.length - 1;
    const gasLimit = await resolveStakeRnbwCallGasLimit({ address, call, provider });
    const transaction = await signer.sendTransaction({
      ...gasParams,
      to: call.to,
      data: call.data,
      value: call.value ?? 0n,
      gasLimit,
    });

    if (isFinalCall) {
      stakeTransaction = transaction;
      confirmationTxHashes.push(transaction.hash);
    } else {
      await waitForWalletTransactions({ provider, txHashes: [transaction.hash] });
    }
  }

  if (!stakeTransaction) {
    throw new RainbowError('[executeStakeRnbw]: sequential wallet staking did not submit a stake transaction');
  }

  const submittedStake = extractReplayableExecution(stakeTransaction);
  if (!submittedStake) {
    throw new RainbowError('[executeStakeRnbw]: sequential wallet staking did not return replayable transaction metadata');
  }

  addNewTransaction({
    address,
    chainId: STAKING_CHAIN_ID,
    transaction: {
      ...buildStakeTransaction({ address, asset, stakeAmountRaw }),
      ...submittedStake.replayableCall,
      hash: submittedStake.hash,
      gasLimit: stakeTransaction.gasLimit,
      gasPrice: stakeTransaction.gasPrice,
      maxFeePerGas: stakeTransaction.maxFeePerGas,
      maxPriorityFeePerGas: stakeTransaction.maxPriorityFeePerGas,
      nonce: submittedStake.nonce,
    },
  });

  return {
    executionMode: 'manual',
    txHash: stakeTransaction.hash,
    waitForConfirmation: () => waitForWalletTransactions({ provider, txHashes: confirmationTxHashes }),
  };
}

function buildStakeTransaction({
  address,
  asset,
  stakeAmountRaw,
}: {
  address: Address;
  asset: TransactionAssetSource;
  stakeAmountRaw: string;
}): Omit<NewTransaction, 'hash'> {
  const chainName = backendNetworksActions.getChainsName()[STAKING_CHAIN_ID];
  const transactionAsset = toTransactionAsset({ asset, chainName });

  return {
    asset: transactionAsset,
    chainId: STAKING_CHAIN_ID,
    changes: [
      {
        address_from: address,
        address_to: STAKING_CONTRACT_ADDRESS,
        asset: transactionAsset,
        direction: TransactionDirection.OUT,
        price: asset.price?.value,
        value: stakeAmountRaw,
      },
    ],
    from: address,
    network: chainName,
    nonce: -1,
    status: TransactionStatus.pending,
    to: STAKING_CONTRACT_ADDRESS,
    type: 'stake',
    value: 0,
  };
}

async function resolveStakeRnbwCallGasLimit({
  address,
  call,
  provider,
}: {
  address: Address;
  call: Call;
  provider: StaticJsonRpcProvider;
}): Promise<TransactionResponse['gasLimit'] | number> {
  try {
    return await provider.estimateGas({
      data: call.data,
      from: address,
      to: call.to,
      value: call.value ?? 0n,
    });
  } catch {
    return resolveStakeRnbwCallFallbackGasLimit(call.to);
  }
}

function resolveStakeRnbwCallFallbackGasLimit(to: string): number {
  if (to === RNBW_TOKEN_ADDRESS) return STAKING_APPROVAL_GAS_LIMIT;
  if (to === STAKING_CONTRACT_ADDRESS) return STAKING_GAS_LIMIT;
  throw new RainbowError(`[executeStakeRnbw]: unsupported staking call target (${to})`);
}
