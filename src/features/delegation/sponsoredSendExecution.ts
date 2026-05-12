import { type Signer } from '@ethersproject/abstract-signer';
import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { isAddress, type Address } from 'viem';

import { type ParsedAddressAsset } from '@/entities/tokens';
import { type NewTransaction } from '@/entities/transactions';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { buildTransaction } from '@/handlers/web3';
import { ensureError, logger } from '@/logger';
import { type ChainId } from '@/state/backendNetworks/types';
import { type Call, type ExecuteCallsResult, type PreparedCallsExecution } from '@rainbow-me/delegation';

import { buildPendingSendTransaction, buildSendCall, isPreparedSponsoredSend, prepareSponsoredSend } from './sponsoredSend';

type ExecuteSponsoredSendWithTracking = (params: {
  account: Address;
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
  asset: ParsedAddressAsset | UniqueAsset;
  chainId: ChainId;
  provider: StaticJsonRpcProvider;
  toAddress: string;
};

type ExecuteSponsoredSendIfAvailableParams = {
  accountAddress: string;
  call: Call;
  canPrepareSponsoredSend: boolean;
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
  canPrepareSponsoredSend,
  chainId,
  executeSponsoredSendWithTracking,
  preparedCalls,
  provider,
  signer,
  transaction,
}: ExecuteSponsoredSendIfAvailableParams): Promise<boolean> {
  let preparedSponsoredSendCalls = preparedCalls;
  if (!isAddress(accountAddress)) return false;

  if (canPrepareSponsoredSend && !isPreparedSponsoredSend(preparedSponsoredSendCalls)) {
    try {
      preparedSponsoredSendCalls = await prepareSponsoredSend({
        account: accountAddress,
        call,
        chainId,
      });
    } catch (error) {
      logger.warn('[executeSponsoredSendIfAvailable]: sponsored send preparation failed during submit', {
        message: ensureError(error).message,
      });
    }
  }

  if (!isPreparedSponsoredSend(preparedSponsoredSendCalls)) return false;

  const sponsoredExecution = await executeSponsoredSendWithTracking({
    account: accountAddress,
    call,
    chainId,
    preparedCalls: preparedSponsoredSendCalls,
    provider,
    signer,
    transaction: buildPendingSendTransaction({ call, transaction }),
  });

  return Boolean(sponsoredExecution);
}
