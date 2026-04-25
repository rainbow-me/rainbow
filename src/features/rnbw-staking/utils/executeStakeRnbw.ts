import type { TransactionResponse } from '@ethersproject/abstract-provider';
import type { Signer } from '@ethersproject/abstract-signer';
import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { type Address } from 'viem';

import { TransactionDirection, TransactionStatus, type NewTransaction } from '@/entities/transactions';
import { trackCallsExecution } from '@/features/delegation/callsExecutionTracking';
import { resolveManagedExecutionFailure } from '@/features/delegation/managedExecutionFailure';
import { waitForManagedExecutionConfirmation } from '@/features/delegation/waitForManagedExecution';
import { RainbowError } from '@/logger';
import { extractReplayableExecution } from '@/raps/replay';
import { toTransactionAsset, type TransactionAssetSource } from '@/raps/transactionAsset';
import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import { addNewTransaction } from '@/state/pendingTransactions';
import { time } from '@/utils/time';
import { execute, type ExecuteCallsResult, type PreparedCallsExecution } from '@rainbow-me/delegation';

import { STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS, STAKING_GAS_LIMIT } from '../constants';
import { buildStakeRnbwCalls, buildStakeRnbwExecutionPlan } from './stakeRnbwCalls';

// ============ Types ========================================================= //

/** Execution lane used for the wallet-funded or relay-sponsored stake call. */
export type StakeRnbwExecutionMode = 'manual' | 'sponsored';

/** Submitted staking execution plus the confirmation waiter for its lane. */
export type StakeRnbwExecution = {
  executionMode: StakeRnbwExecutionMode;
  waitForConfirmation: () => Promise<void>;
};

type ExecuteStakeRnbwParams = {
  address: Address;
  asset: TransactionAssetSource;
  preparedCalls: PreparedCallsExecution | null;
  provider: StaticJsonRpcProvider;
  signer: Signer;
  stakeAmountRaw: string;
};

type WalletStakeCallsExecution = Extract<ExecuteCallsResult, { kind: 'calls.wallet' }>;

// ============ Execution ===================================================== //

/**
 * Executes the RNBW approval + stake call sequence.
 */
export async function executeStakeRnbw({
  address,
  asset,
  preparedCalls,
  provider,
  signer,
  stakeAmountRaw,
}: ExecuteStakeRnbwParams): Promise<StakeRnbwExecution> {
  if (!(signer instanceof Wallet)) {
    return executeSequentialStakeRnbw({ address, asset, provider, signer, stakeAmountRaw });
  }

  const execution = await executeSdkStakeRnbw({
    address,
    preparedCalls,
    provider,
    signer,
    stakeAmountRaw,
  });

  if (execution.kind === 'calls.wallet') {
    const stakeTransaction = requireSubmittedStakeTransaction(execution);
    const txHashes = execution.transactions.map(transaction => transaction.hash);
    trackCallsExecution({
      address,
      batch: false,
      chainId: STAKING_CHAIN_ID,
      execution: stakeTransaction,
      transaction: buildStakeTransaction({ address, asset, stakeAmountRaw }),
    });

    return {
      executionMode: 'manual',
      waitForConfirmation: () => waitForWalletTransactions({ provider, txHashes }),
    };
  }

  const failureMessage = await resolveManagedExecutionFailure({
    executionId: execution.executionId,
    status: execution.status,
  });

  if (failureMessage) {
    throw new RainbowError(`[executeStakeRnbw]: ${failureMessage}`);
  }

  trackCallsExecution({
    address,
    batch: false,
    chainId: STAKING_CHAIN_ID,
    execution,
    transaction: buildStakeTransaction({ address, asset, stakeAmountRaw }),
  });

  return {
    executionMode: 'sponsored',
    waitForConfirmation: () => waitForManagedExecutionConfirmation(execution.executionId),
  };
}

// ============ Local Helpers ================================================= //

async function executeSdkStakeRnbw({
  address,
  preparedCalls,
  provider,
  signer,
  stakeAmountRaw,
}: {
  address: Address;
  preparedCalls: PreparedCallsExecution | null;
  provider: StaticJsonRpcProvider;
  signer: Wallet;
  stakeAmountRaw: string;
}): Promise<ExecuteCallsResult> {
  if (preparedCalls) {
    return execute.calls(preparedCalls, {
      signer,
      provider,
      chainId: STAKING_CHAIN_ID,
    });
  }

  const plan = await buildStakeRnbwExecutionPlan({ address, provider, stakeAmountRaw });
  const params = {
    ...plan,
    signer,
    provider,
    chainId: STAKING_CHAIN_ID,
  };

  return execute.calls(params);
}

async function executeSequentialStakeRnbw({
  address,
  asset,
  provider,
  signer,
  stakeAmountRaw,
}: {
  address: Address;
  asset: TransactionAssetSource;
  provider: StaticJsonRpcProvider;
  signer: Signer;
  stakeAmountRaw: string;
}): Promise<StakeRnbwExecution> {
  const calls = await buildStakeRnbwCalls({ address, provider, stakeAmountRaw });
  const confirmationTxHashes: string[] = [];
  let stakeTransaction: TransactionResponse | null = null;

  for (let index = 0; index < calls.length; index++) {
    const call = calls[index];
    const isStakeCall = call.to === STAKING_CONTRACT_ADDRESS;
    const isFinalCall = index === calls.length - 1;
    const transaction = await signer.sendTransaction({
      to: call.to,
      data: call.data,
      value: call.value ?? 0n,
      ...(isStakeCall ? { gasLimit: STAKING_GAS_LIMIT } : {}),
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
    waitForConfirmation: () => waitForWalletTransactions({ provider, txHashes: confirmationTxHashes }),
  };
}

function requireSubmittedStakeTransaction(execution: WalletStakeCallsExecution): WalletStakeCallsExecution['transactions'][number] {
  const stakeTransaction = execution.transactions.at(-1);
  if (!stakeTransaction) {
    throw new RainbowError('[executeStakeRnbw]: wallet staking did not submit a transaction');
  }
  return stakeTransaction;
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

async function waitForWalletTransactions({ provider, txHashes }: { provider: StaticJsonRpcProvider; txHashes: string[] }): Promise<void> {
  for (const hash of txHashes) {
    const receipt = await provider.waitForTransaction(hash, 1, time.minutes(2));

    if (!receipt) {
      throw new RainbowError(`[executeStakeRnbw]: wallet staking transaction was not confirmed (${hash})`);
    }

    if (receipt.status === 0) {
      throw new RainbowError(`[executeStakeRnbw]: wallet staking transaction failed (${hash})`);
    }
  }
}
