import { isAddressEqual, type Address } from 'viem';
import { readContract } from 'viem/actions';

import { ensContracts } from '../core/contracts';
import { withEnsClient, type EnsClient } from './client';
import { registryAbi, supportsInterface } from './contracts';

export type EnsToken = { contractAddress: Address; tokenId: string };

const PERMISSIONED_REGISTRY_INTERFACE = '0xc18bd555';
export const REGISTERED = 2;

/**
 * Reads the current permissioned registry entry from a labelhash or an older token ID.
 * Other registry implementations can still resolve names.
 */
export async function getRegistryState(client: EnsClient, registry: Address, id: bigint) {
  if (
    !isAddressEqual(registry, ensContracts.ethRegistry) &&
    !(await supportsInterface(client, registry, PERMISSIONED_REGISTRY_INTERFACE))
  ) {
    return null;
  }

  return readContract(client, { address: registry, abi: registryAbi, functionName: 'getState', args: [id] });
}

/**
 * Role changes regenerate native token IDs. The selected token identifies its
 * registry entry across versions, independently of the collection's metadata.
 */
export function currentEnsTokenId(token: EnsToken, sender: string): Promise<string> {
  return withEnsClient(async client => {
    const state = await getRegistryState(client, token.contractAddress, BigInt(token.tokenId));
    if (!state) return token.tokenId;
    if (state.status !== REGISTERED || state.latestOwner.toLowerCase() !== sender.toLowerCase()) {
      throw new Error('Sender no longer owns this ENS token');
    }

    return String(state.tokenId);
  });
}
