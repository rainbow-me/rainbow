import { type Signer } from '@ethersproject/abstract-signer';
import { hexlify } from '@ethersproject/bytes';
import { type StaticJsonRpcProvider, type TransactionRequest } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { isAddress, isHex, type Address, type Hex } from 'viem';

import { TransactionStatus, type NewTransaction } from '@/entities/transactions/transaction';
import { getRemoteConfig } from '@/features/config/stores/remoteConfig';
import { createDelegationPublicClient, SPONSORED_CALLS_REQUIREMENTS } from '@/features/delegation/calls';
import { trackCallsExecution } from '@/features/delegation/callsExecutionTracking';
import { resolveManagedExecutionFailure } from '@/features/delegation/managedExecutionFailure';
import { predictSponsoredCallsExecution } from '@/features/delegation/sponsoredCalls';
import { canUseDelegatedExecution, supportsDelegatedExecution } from '@/features/delegation/willDelegate';
import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { RainbowError } from '@/logger';
import { execute, type Call, type ExecuteCallsResult, type ExecutionResult, type PreparedCallsExecution } from '@rainbow-me/delegation';

// ============ Types ========================================================= //

type PredictSponsoredSendParams = {
  address: string | null | undefined;
  chainId: ChainId | null;
  sponsorshipEligibleChainIds?: ChainId[];
};

type PrepareSponsoredSendParams = {
  accountAddress: Address;
  call: Call;
  chainId: ChainId;
  delegationSupported?: boolean;
  signal?: AbortSignal;
};

type ExecuteSponsoredSendParams = PrepareSponsoredSendParams & {
  preparedCalls: PreparedCallsExecution | null;
  provider: StaticJsonRpcProvider;
  signer: Signer;
  transaction: Omit<NewTransaction, 'hash'>;
};

type SendCallTransaction = Pick<TransactionRequest, 'data' | 'to' | 'value'>;

// ============ Sponsorship =================================================== //

export function predictSponsoredSend({ address, chainId, sponsorshipEligibleChainIds }: PredictSponsoredSendParams): boolean {
  if (!address || !isAddress(address) || !getRemoteConfig().sponsored_sends_enabled) return false;

  return predictSponsoredCallsExecution({
    address,
    chainId,
    sponsorshipEligibleChainIds,
  });
}

export async function prepareSponsoredSend({
  accountAddress,
  call,
  chainId,
  delegationSupported,
  signal,
}: PrepareSponsoredSendParams): Promise<PreparedCallsExecution | null> {
  if (signal?.aborted) return null;
  if (!canRequestSponsoredSend(chainId)) return null;

  const canExecute = delegationSupported ?? (await supportsDelegatedExecution({ address: accountAddress, chainId }));
  if (signal?.aborted) return null;
  if (!canExecute) return null;

  const preparedCalls = await execute.prepare.calls({
    account: accountAddress,
    calls: [call],
    chainId,
    publicClient: createDelegationPublicClient(chainId, signal ? { signal } : undefined),
    requirements: SPONSORED_CALLS_REQUIREMENTS,
  });

  if (signal?.aborted) return null;
  return preparedCalls;
}

export async function executeSponsoredSend({
  accountAddress,
  call,
  chainId,
  preparedCalls,
  provider,
  signer,
  transaction,
}: ExecuteSponsoredSendParams): Promise<ExecuteCallsResult | null> {
  if (!(signer instanceof Wallet) || !canUseDelegatedExecution(accountAddress)) return null;

  const execution = await executeSendCall({ call, chainId, preparedCalls, provider, signer });

  if (execution.kind === 'calls.managed') {
    const failureMessage = await resolveManagedExecutionFailure({
      executionId: execution.executionId,
      status: execution.status,
    });

    if (failureMessage) {
      throw new RainbowError(`[executeSponsoredSend]: ${failureMessage}`);
    }

    trackCallsExecution({
      address: accountAddress,
      batch: false,
      chainId,
      execution,
      transaction,
    });
    return execution;
  }

  const submittedTransaction = requireSingleWalletSendExecution(execution);
  trackCallsExecution({
    address: accountAddress,
    batch: false,
    chainId,
    execution: submittedTransaction,
    transaction,
  });

  return execution;
}

export function buildSendCall(transaction: SendCallTransaction): Call {
  const to = transaction.to?.toString();
  if (!to || !isAddress(to)) {
    throw new RainbowError(`[buildSendCall]: invalid transaction recipient`);
  }

  return {
    to,
    value: parseCallValue(transaction.value),
    data: normalizeCallData(transaction.data),
  };
}

export function buildPendingSendTransaction({
  call,
  transaction,
}: {
  call: Call;
  transaction: Omit<NewTransaction, 'hash' | 'status' | 'txTo' | 'type'>;
}): Omit<NewTransaction, 'hash'> {
  return {
    ...transaction,
    data: call.data,
    status: TransactionStatus.pending,
    txTo: call.to,
    type: 'send',
    value: call.value,
  };
}

// ============ Local Helpers ================================================= //

function canRequestSponsoredSend(chainId: ChainId): boolean {
  return getRemoteConfig().sponsored_sends_enabled === true && backendNetworksActions.isSponsorshipEligible(chainId);
}

function executeSendCall({
  call,
  chainId,
  preparedCalls,
  provider,
  signer,
}: {
  call: Call;
  chainId: ChainId;
  preparedCalls: PreparedCallsExecution | null;
  provider: StaticJsonRpcProvider;
  signer: Wallet;
}): Promise<ExecuteCallsResult> {
  if (preparedCalls) {
    return execute.calls(preparedCalls, {
      chainId,
      provider,
      signer,
    });
  }

  if (!canRequestSponsoredSend(chainId)) {
    throw new RainbowError(`[executeSponsoredSend]: sponsored sends are unavailable on chain ${chainId}`);
  }

  return execute.calls({
    calls: [call],
    chainId,
    provider,
    requirements: SPONSORED_CALLS_REQUIREMENTS,
    signer,
  });
}

function requireSingleWalletSendExecution(result: ExecuteCallsResult): ExecutionResult {
  if (result.kind !== 'calls.wallet' || result.transactions.length !== 1) {
    throw new RainbowError(`[executeSponsoredSend]: exact send execution must resolve to one wallet transaction`);
  }

  return result.transactions[0];
}

function parseCallValue(value: TransactionRequest['value']): bigint {
  if (value === undefined || value === null) return 0n;
  return BigInt(value.toString());
}

function normalizeCallData(data: TransactionRequest['data']): Hex {
  const value = data === undefined || data === null ? '0x' : typeof data === 'string' ? data : hexlify(data);
  if (!isHex(value)) {
    throw new RainbowError(`[buildSendCall]: invalid transaction data`);
  }
  return value;
}
