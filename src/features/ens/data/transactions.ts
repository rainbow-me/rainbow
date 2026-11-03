import { encodeFunctionData, getAddress, isAddressEqual, type Address, type Hex } from 'viem';
import { estimateGas, simulateCalls } from 'viem/actions';

import { ensContracts } from '../core/contracts';
import { normalizeEnsName } from '../core/name';
import type { EnsAction, EnsTransaction } from '../types/transactions';
import { withEnsClient, type EnsClient } from './client';
import { legacyAbi, resolverAbi } from './contracts';
import { getEnsOwnership, isNameToken } from './ownership';
import { encodeEnsRecordClear, encodeEnsRecordWrites, getEnsWriteResolver, getLegacyRecordClears } from './resolver';

export function prepareEnsTransactions(action: EnsAction, account: Address): Promise<EnsTransaction[]> {
  return withEnsClient(client => prepareTransferChanges(client, normalizeEnsName(action.name), action, account));
}

async function prepareTransferChanges(
  client: EnsClient,
  name: string,
  action: Extract<EnsAction, { type: 'transfer' }>,
  account: Address
): Promise<EnsTransaction[]> {
  const transactions: EnsTransaction[] = [];
  const ownership = await getEnsOwnership(client, name);
  if (!ownership || !isNameToken(ownership, action.token)) throw new Error('ENS name does not identify the selected NFT');
  const holder = ownership.version === 1 ? ownership.registrant : ownership.owner;
  if (!holder || !isAddressEqual(holder, account)) throw new Error('Sender no longer owns this ENS token');
  if (action.clearRecords || action.setAddress) {
    const resolver = await getEnsWriteResolver(client, name);
    if (!resolver) throw new Error('ENS name has no writable resolver');
    let writes: Hex[] = [];
    if (action.clearRecords) {
      writes = resolver.permissioned ? encodeEnsRecordClear(name) : await getLegacyRecordClears(name, resolver.address);
    }
    if (action.setAddress) writes.push(...encodeEnsRecordWrites(name, { ETH: action.toAddress }, resolver.permissioned));
    if (writes.length) transactions.push(recordTransaction(resolver.address, writes));
  }
  if (action.transferControl) {
    // Only an unwrapped v1 registration has separate registry control.
    if (ownership.version === 1 && ownership.token && isAddressEqual(ownership.token.contractAddress, ensContracts.legacyRegistrar)) {
      transactions.push({
        to: ensContracts.legacyRegistrar,
        data: encodeFunctionData({
          abi: legacyAbi,
          functionName: 'reclaim',
          args: [BigInt(ownership.token.tokenId), getAddress(action.toAddress)],
        }),
        operation: 'reclaim',
      });
    }
  }
  return transactions;
}

function recordTransaction(to: Address, writes: Hex[]): EnsTransaction {
  return {
    to,
    data: writes.length === 1 ? writes[0] : encodeFunctionData({ abi: resolverAbi, functionName: 'multicall', args: [writes] }),
    operation: 'records',
  };
}

/**
 * Simulates dependent transactions together, so approvals and resolver deployment
 * are reflected in the calls that follow them.
 */
export async function estimateEnsTransactions(action: EnsAction, account: Address): Promise<string> {
  const transactions = await prepareEnsTransactions(action, account);
  if (!transactions.length) return '0';
  return withEnsClient(async client => {
    if (transactions.length === 1) {
      const tx = transactions[0];
      const gas = await estimateGas(client, { account, to: tx.to, data: tx.data });
      return String(paddedGas(gas));
    }
    const simulation = await simulateCalls(client, {
      account,
      calls: transactions.map(transaction => ({ to: transaction.to, data: transaction.data })),
    });
    let gas = 0n;
    for (const result of simulation.results) {
      if (result.status === 'failure') throw result.error;
      gas += result.gasUsed;
    }
    return String(paddedGas(gas));
  });
}

function paddedGas(gas: bigint): bigint {
  return (gas * 110n + 99n) / 100n;
}
