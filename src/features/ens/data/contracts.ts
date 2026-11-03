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

export const registrarAbi = parseAbi([
  'function isAvailable(string label) view returns (bool)',
  'function getRegisterPrice(string label, uint64 duration, address paymentToken) view returns (uint256 base, uint256 premium)',
  'function getRenewPrice(string label, uint64 duration, address paymentToken) view returns (uint256)',
  'function makeCommitment(string label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, bytes32 referrer) pure returns (bytes32)',
  'function commit(bytes32 commitment)',
  'function register(string label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, address paymentToken, bytes32 referrer) returns (uint256)',
  'function renew((string label, uint64 duration, bytes32 referrer) renewal, address paymentToken)',
]);

export const resolverAbi = parseAbi([
  'function initialize((address account, uint256 roleBitmap)[] grants, bytes[] calls)',
  'function setAddress(bytes name, uint256 coinType, bytes value)',
  'function setText(bytes name, string key, string value)',
  'function setContenthash(bytes name, bytes value)',
  'function linkToRecord(bytes name, uint256 recordId)',
  'function roles(uint256 resource, address account) view returns (uint256)',
  'function hasRoles(uint256 resource, uint256 roles, address account) view returns (bool)',
  'function multicall(bytes[] calls) returns (bytes[])',
]);

export const factoryAbi = parseAbi([
  'function predictProxyAddress(address deployer, uint256 salt) view returns (address)',
  'function deployProxy(address implementation, uint256 salt, bytes data) returns (address)',
]);

export const legacyAbi = parseAbi([
  'function owner(bytes32 node) view returns (address)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function nameExpires(uint256 tokenId) view returns (uint256)',
  'function getData(uint256 tokenId) view returns (address owner, uint32 fuses, uint64 expiry)',
  'function setAddr(bytes32 node, uint256 coinType, bytes value)',
  'function setText(bytes32 node, string key, string value)',
  'function setContenthash(bytes32 node, bytes value)',
  'function multicall(bytes[] calls) returns (bytes[])',
  'function reclaim(uint256 tokenId, address owner)',
  'function setName(string name) returns (bytes32)',
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
