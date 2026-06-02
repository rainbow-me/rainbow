import { type Signer } from '@ethersproject/abstract-signer';
import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { isAddress, type Address } from 'viem';

import { type ParsedAddressAsset } from '@/entities/tokens';
import { type NewTransaction } from '@/entities/transactions';
import { requireAddress } from '@/framework/core/evm/address';
import { encodeErc20Transfer } from '@/framework/core/evm/erc20Calldata';
import { parsePositiveRawAmount } from '@/framework/core/evm/units';
import { isNativeAsset } from '@/handlers/assets';
import { resolveNameOrAddress } from '@/handlers/web3';
import { type ChainId } from '@/state/backendNetworks/types';
import { type Call, type ExecuteCallsResult, type PreparedCallsExecution } from '@rainbow-me/delegation';

import { isPreparedCallsExecutionSponsored } from './calls';
import { buildPendingSendTransaction } from './sponsoredSend';

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
  amount: string;
  asset: ParsedAddressAsset;
  chainId: ChainId;
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
  amount,
  asset,
  chainId,
  toAddress,
}: BuildSendCallFromSendDetailsParams): Promise<Call> {
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
  if (!isAddress(accountAddress) || !isPreparedCallsExecutionSponsored(preparedCalls)) return false;

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
