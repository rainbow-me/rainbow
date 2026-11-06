import {
  BaseError,
  ContractFunctionRevertedError,
  getAddress,
  isAddressEqual,
  labelhash,
  maxUint64,
  toHex,
  zeroAddress,
  type Address,
} from 'viem';
import { getEnsResolver, readContract } from 'viem/actions';
import { namehash, packetToBytes } from 'viem/ens';

import { ensContracts } from '../core/contracts';
import { normalizeEnsName } from '../core/name';
import { withEnsClient, type EnsClient } from './client';
import { helperAbi, legacyAbi } from './contracts';
import { getRegistryState, REGISTERED, type EnsToken } from './registry';

/**
 * Current control and NFT identity. Only v1 has a separate registrant/controller.
 */
export type EnsOwnership = {
  /** Registry controller in v1, token owner in v2. */
  owner: Address | null;
  expiryDate: number | null;
} & ({ version: 1; registrant: Address | null; token: EnsToken | null } | { version: 2; token: EnsToken });

export function readEnsOwnership(name: string, signal?: AbortSignal): Promise<EnsOwnership | null> {
  return withEnsClient(client => getEnsOwnership(client, normalizeEnsName(name)), signal);
}

/**
 * Reads current ownership from the registry serving the name. Legacy ownership
 * is used only while the v2 hierarchy explicitly delegates to the v1 mirror.
 */
export async function getEnsOwnership(client: EnsClient, name: string): Promise<EnsOwnership | null> {
  const parts = name.split('.');
  const labelId = BigInt(labelhash(parts[0]));
  const dnsName = toHex(packetToBytes(name));
  const registry = await readContract(client, {
    address: ensContracts.helper,
    abi: helperAbi,
    functionName: 'findParentRegistry',
    args: [dnsName],
  });

  if (registry !== zeroAddress) {
    const state = await getRegistryState(client, registry, labelId);
    // Once registered in v2, expired names must not recover their retired v1 owner.
    if (state && state.latestOwner !== zeroAddress) {
      const currentOwner = state.status === REGISTERED ? getAddress(state.latestOwner) : null;
      return {
        version: 2,
        owner: currentOwner,
        token: { contractAddress: registry, tokenId: String(state.tokenId) },
        expiryDate: state.expiry === maxUint64 ? null : Number(state.expiry),
      };
    }
  }

  const resolver = await getEnsResolver(client, { name });
  if (!resolver || !isAddressEqual(resolver, ensContracts.legacyMirror)) return null;

  const node = namehash(name);
  const legacyOwner = await readContract(client, {
    address: ensContracts.legacyRegistry,
    abi: legacyAbi,
    functionName: 'owner',
    args: [node],
  });

  const wrapped = isAddressEqual(legacyOwner, ensContracts.nameWrapper);
  const isEthRegistration = parts.length === 2 && parts[1] === 'eth';
  const tokenId = wrapped ? BigInt(node) : labelId;
  let controller = legacyOwner;
  let registrant: Address | null = null;
  let expiryDate: number | null = null;

  if (wrapped) {
    const [owner, , expiry] = await readContract(client, {
      address: ensContracts.nameWrapper,
      abi: legacyAbi,
      functionName: 'getData',
      args: [tokenId],
    });
    controller = owner;
    registrant = owner;
    expiryDate = Number(expiry);
  }

  if (isEthRegistration) {
    const expiry = await readContract(client, {
      address: ensContracts.legacyRegistrar,
      abi: legacyAbi,
      functionName: 'nameExpires',
      args: [labelId],
    });
    expiryDate = Number(expiry);

    if (!wrapped) {
      try {
        registrant = await readContract(client, {
          address: ensContracts.legacyRegistrar,
          abi: legacyAbi,
          functionName: 'ownerOf',
          args: [tokenId],
        });
      } catch (error) {
        // Expired registrations have no token owner, including during the renewal grace period.
        const revert = error instanceof BaseError && error.walk(cause => cause instanceof ContractFunctionRevertedError);
        if (!(revert instanceof ContractFunctionRevertedError)) throw error;
      }
    }
  }

  return {
    version: 1,
    owner: controller === zeroAddress ? null : getAddress(controller),
    registrant: registrant && registrant !== zeroAddress ? getAddress(registrant) : null,
    token:
      wrapped || isEthRegistration
        ? { contractAddress: wrapped ? ensContracts.nameWrapper : ensContracts.legacyRegistrar, tokenId: String(tokenId) }
        : null,
    expiryDate,
  };
}

/**
 * The low 32 bits of a permissioned registry's token ID are its version.
 * Legacy token IDs must match exactly.
 */
export function isNameToken(ownership: EnsOwnership | null | undefined, selected: EnsToken): boolean {
  const token = ownership?.token;
  if (!token || !isAddressEqual(token.contractAddress, selected.contractAddress)) return false;

  const difference = BigInt(token.tokenId) ^ BigInt(selected.tokenId);
  return ownership.version === 2 ? difference >> 32n === 0n : difference === 0n;
}
