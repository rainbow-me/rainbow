import { type Signer } from '@ethersproject/abstract-signer';
import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { isAddress, type Address } from 'viem';

import { type ParsedAddressAsset } from '@/entities/tokens';
import { type NewTransaction } from '@/entities/transactions';
import { requireAddress } from '@/features/address/core/requireAddress';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { encodeErc20Transfer } from '@/features/token/core/services/erc20Calldata';
import { parsePositiveRawAmount } from '@/features/token/core/services/tokenAmount';
import { isNativeAsset } from '@/handlers/assets';
import { resolveNameOrAddress } from '@/handlers/web3';
import { type CallInput, type ExecutionSubmission, type PreparedCallsExecution } from '@rainbow-me/sdk';

import { buildPendingSendTransaction } from './sponsoredSend';

type ExecuteSponsoredSendWithTracking = (params: {
  accountAddress: Address;
  call: CallInput;
  chainId: ChainId;
  preparedCalls: PreparedCallsExecution<'calls.managed'> | null;
  provider: StaticJsonRpcProvider;
  signer: Signer;
  transaction: Omit<NewTransaction, 'hash'>;
}) => Promise<ExecutionSubmission<'calls.managed'> | null>;

type BuildSendCallFromSendDetailsParams = {
  amount: string;
  asset: ParsedAddressAsset;
  chainId: ChainId;
  toAddress: string;
};

type ExecuteSponsoredSendIfAvailableParams = {
  accountAddress: string;
  call: CallInput;
  chainId: ChainId;
  executeSponsoredSendWithTracking: ExecuteSponsoredSendWithTracking;
  preparedCalls: PreparedCallsExecution<'calls.managed'> | null;
  provider: StaticJsonRpcProvider;
  signer: Signer;
  transaction: Omit<NewTransaction, 'hash' | 'status' | 'txTo' | 'type'>;
};

export async function buildSendCallFromSendDetails({
  amount,
  asset,
  chainId,
  toAddress,
}: BuildSendCallFromSendDetailsParams): Promise<CallInput> {
  const recipient = await resolveSendAddress(toAddress);
  const rawAmount = parsePositiveRawAmount(amount, asset.decimals, '[buildSendCallFromSendDetails]: invalid send amount');

  if (isNativeAsset(asset.address, chainId)) {
    return {
      data: '0x',
      to: recipient,
      value: rawAmount,
    };
  }

  return {
    data: encodeErc20Transfer({ amount: rawAmount, to: recipient }),
    to: requireAddress(asset.address, '[buildSendCallFromSendDetails]: invalid token address'),
    value: 0n,
  };
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
  if (!isAddress(accountAddress) || !preparedCalls) return false;

  const sponsoredExecution = await executeSponsoredSendWithTracking({
    accountAddress,
    call,
    chainId,
    preparedCalls,
    provider,
    signer,
    transaction: buildPendingSendTransaction({ call, transaction }),
  });

  return Boolean(sponsoredExecution);
}

async function resolveSendAddress(address: string): Promise<Address> {
  const resolved = await resolveNameOrAddress(address);
  return requireAddress(resolved, '[buildSendCallFromSendDetails]: invalid recipient');
}
