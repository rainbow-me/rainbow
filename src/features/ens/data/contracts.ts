import {
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  erc1155Abi,
  parseAbi,
  type Address,
  type Hex,
} from 'viem';
import { readContract } from 'viem/actions';

import type { EnsClient } from './client';

export const helperAbi = parseAbi(['function findParentRegistry(bytes name) view returns (address)']);

export const registryAbi = parseAbi([
  'function getState(uint256 id) view returns ((uint8 status, uint64 expiry, address latestOwner, uint256 tokenId, uint256 resource))',
]);

export const resolverAbi = parseAbi([
  'function roles(uint256 resource, address account) view returns (uint256)',
  'function hasRoles(uint256 resource, uint256 roles, address account) view returns (bool)',
]);

export const legacyAbi = parseAbi([
  'function owner(bytes32 node) view returns (address)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function nameExpires(uint256 tokenId) view returns (uint256)',
  'function getData(uint256 tokenId) view returns (address owner, uint32 fuses, uint64 expiry)',
  'function setText(bytes32 node, string key, string value)',
]);

export const compositeResolverAbi = parseAbi(['function getResolver(bytes name) view returns (address resolver, bool offchain)']);

export async function supportsInterface(client: EnsClient, address: Address, id: Hex): Promise<boolean> {
  try {
    return await readContract(client, { address, abi: erc1155Abi, functionName: 'supportsInterface', args: [id] });
  } catch (error) {
    if (
      error instanceof BaseError &&
      error.walk(cause => cause instanceof ContractFunctionRevertedError || cause instanceof ContractFunctionZeroDataError)
    )
      return false;
    throw error;
  }
}
