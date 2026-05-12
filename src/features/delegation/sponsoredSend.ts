import { type Signer } from '@ethersproject/abstract-signer';
import { hexlify, isBytesLike } from '@ethersproject/bytes';
import { type StaticJsonRpcProvider, type TransactionRequest } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { isAddress, isHex, type Address, type Hex } from 'viem';

import { TransactionStatus, type NewTransaction } from '@/entities/transactions/transaction';
import { RainbowError } from '@/logger';
import { getRemoteConfig } from '@/model/remoteConfig';
import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { execute, type Call, type ExecuteCallsResult, type ExecutionResult, type PreparedCallsExecution } from '@rainbow-me/delegation';

import { createDelegationPublicClient, isPreparedCallsExecutionSponsored, SPONSORED_CALLS_REQUIREMENTS } from './calls';
import { trackCallsExecution } from './callsExecutionTracking';
import { resolveManagedExecutionFailure } from './managedExecutionFailure';
import { predictSponsoredCallsExecution } from './sponsoredCalls';
import { canUseDelegatedExecution, supportsDelegatedExecution } from './willDelegate';

// ============ Types ========================================================= //

type PredictSponsoredSendParams = {
  address: string | null | undefined;
  chainId: ChainId | null;
  sponsorshipEligibleChainIds?: ChainId[];
};

type PrepareSponsoredSendParams = {
  account: Address;
  call: Call;
  chainId: ChainId;
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

export function isPreparedSponsoredSend(preparedCalls: PreparedCallsExecution | null): boolean {
  return isPreparedCallsExecutionSponsored(preparedCalls);
}

export async function prepareSponsoredSend({ account, call, chainId }: PrepareSponsoredSendParams): Promise<PreparedCallsExecution | null> {
  if (!canRequestSponsoredSend(chainId)) return null;

  const canExecute = await supportsDelegatedExecution({ address: account, chainId });
  if (!canExecute) return null;

  return execute.prepare.calls({
    account,
    calls: [call],
    chainId,
    publicClient: createDelegationPublicClient(chainId),
    requirements: SPONSORED_CALLS_REQUIREMENTS,
  });
}

export async function executeSponsoredSend({
  account,
  call,
  chainId,
  preparedCalls,
  provider,
  signer,
  transaction,
}: ExecuteSponsoredSendParams): Promise<ExecuteCallsResult | null> {
  if (!(signer instanceof Wallet) || !canUseDelegatedExecution(account)) return null;

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
      address: account,
      batch: false,
      chainId,
      execution,
      transaction,
    });
    return execution;
  }

  const submittedTransaction = requireSingleWalletSendExecution(execution);
  trackCallsExecution({
    address: account,
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
  const value = data === undefined || data === null ? '0x' : typeof data === 'string' ? data : isBytesLike(data) ? hexlify(data) : null;
  if (!value || !isHex(value)) {
    throw new RainbowError(`[buildSendCall]: invalid transaction data`);
  }
  return value;
}
