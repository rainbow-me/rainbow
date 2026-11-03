import { isAddressEqual, toHex, zeroAddress, type Address } from 'viem';
import { getEnsResolver, readContract } from 'viem/actions';
import { packetToBytes } from 'viem/ens';

import { ensContracts } from '../core/contracts';
import type { EnsClient } from './client';
import { compositeResolverAbi, supportsInterface } from './contracts';

export type EnsResolver = { address: Address; permissioned: boolean };

const PERMISSIONED_RESOLVER_INTERFACE_ID = '0x8c2427cc';

/**
 * Returns the onchain resolver and its setter API, following the v1 mirror when present.
 * Missing or offchain resolvers return null.
 */
export async function getEnsWriteResolver(client: EnsClient, name: string): Promise<EnsResolver | null> {
  let address = await getEnsResolver(client, { name });
  if (!address || address === zeroAddress) return null;

  if (isAddressEqual(address, ensContracts.legacyMirror)) {
    const [resolver, offchain] = await readContract(client, {
      address,
      abi: compositeResolverAbi,
      functionName: 'getResolver',
      args: [toHex(packetToBytes(name))],
    });
    if (offchain || resolver === zeroAddress) return null;
    address = resolver;
  }

  const permissioned = await supportsInterface(client, address, PERMISSIONED_RESOLVER_INTERFACE_ID);
  return { address, permissioned };
}
