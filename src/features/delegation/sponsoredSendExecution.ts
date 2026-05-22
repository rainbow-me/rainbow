import { type Signer } from '@ethersproject/abstract-signer';
import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { isAddress, type Address } from 'viem';

import { type ParsedAddressAsset } from '@/entities/tokens';
import { type NewTransaction } from '@/entities/transactions';
import { buildTransaction } from '@/handlers/web3';
import { ensureError, logger } from '@/logger';
import { type ChainId } from '@/state/backendNetworks/types';
import { type Call, type ExecuteCallsResult, type PreparedCallsExecution } from '@rainbow-me/delegation';

import { isPreparedCallsExecutionSponsored } from './calls';
import { buildPendingSendTransaction, buildSendCall, prepareSponsoredSend } from './sponsoredSend';

type ExecuteSponsoredSendWithTracking = (params: {
  accountAddress: Address;
  call: Call;
  chainId: ChainId;
  preparedCalls: PreparedCallsExecution | null;
  provider: StaticJsonRpcProvider;
  signer: Signer;
  transaction: Omit<NewTransaction, 'hash'>;
}) => Promise<ExecuteCallsResult | null>;

type BuildSendCallFromSendDetailsParams = {
  accountAddress: string;
  amount: string;
  asset: ParsedAddressAsset;
  chainId: ChainId;
  provider: StaticJsonRpcProvider;
  toAddress: string;
};

type ExecuteSponsoredSendIfAvailableParams = {
  accountAddress: string;
  call: Call;
  chainId: ChainId;
  executeSponsoredSendWithTracking: ExecuteSponsoredSendWithTracking;
  preparedCalls: PreparedCallsExecution | null;
  provider: StaticJsonRpcProvider;
  signer: Signer;
  transaction: Omit<NewTransaction, 'hash' | 'status' | 'txTo' | 'type'>;
};

export async function buildSendCallFromSendDetails({
  accountAddress,
  amount,
  asset,
  chainId,
  provider,
  toAddress,
}: BuildSendCallFromSendDetailsParams): Promise<Call> {
  const transaction = await buildTransaction(
    {
      address: accountAddress,
      amount: Number(amount),
      asset,
      recipient: toAddress,
    },
    provider,
    chainId
  );

  return buildSendCall(transaction);
}

export async function executeSponsoredSendIfAvailable({
  accountAddress,
  call,
  chainId,
  executeSponsoredSendWithTracking,
  preparedCalls,
  provider,
  signer,
  transaction,
}: ExecuteSponsoredSendIfAvailableParams): Promise<boolean> {
  if (!isAddress(accountAddress)) return false;

  let preparedSponsoredSendCalls = preparedCalls;

  if (!preparedCalls && !isPreparedCallsExecutionSponsored(preparedSponsoredSendCalls)) {
    try {
      preparedSponsoredSendCalls = await prepareSponsoredSend({
        accountAddress,
        call,
        chainId,
      });
    } catch (error) {
      logger.warn('[executeSponsoredSendIfAvailable]: sponsored send preparation failed during submit', {
        message: ensureError(error).message,
      });
    }
  }

  if (!isPreparedCallsExecutionSponsored(preparedSponsoredSendCalls)) return false;

  const sponsoredExecution = await executeSponsoredSendWithTracking({
    accountAddress,
    call,
    chainId,
    preparedCalls: preparedSponsoredSendCalls,
    provider,
    signer,
    transaction: buildPendingSendTransaction({ call, transaction }),
  });

  return Boolean(sponsoredExecution);
}
