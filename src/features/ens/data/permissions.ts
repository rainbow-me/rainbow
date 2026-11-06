import {
  BaseError,
  ContractFunctionRevertedError,
  encodePacked,
  keccak256,
  stringToHex,
  type Address,
  type ContractFunctionParameters,
} from 'viem';
import { multicall, readContract, simulateContract } from 'viem/actions';
import { namehash } from 'viem/ens';

import { normalizeEnsName } from '../core/name';
import { ETHEREUM_COIN_TYPE } from '../core/records';
import { withEnsClient, type EnsClient } from './client';
import { legacyAbi, resolverAbi } from './contracts';
import { PROFILE_RECORD_KEYS } from './recordKeys';
import { getEnsWriteResolver } from './resolver';

const ADDRESS_ROLE = 1n;
const TEXT_ROLE = 1n << 4n;
const CONTENTHASH_ROLE = 1n << 8n;
const LINK_ROLE = 1n << 28n;
const CLEAR_RECORDS_ROLES = LINK_ROLE | CONTENTHASH_ROLE;
const ETH_ADDRESS_RESOURCE = BigInt(keccak256(encodePacked(['uint256'], [BigInt(ETHEREUM_COIN_TYPE)])));

const OTHER_RECORD_PERMISSIONS = [
  ...PROFILE_RECORD_KEYS.coins
    .filter(coin => coin !== ETHEREUM_COIN_TYPE)
    .map(coin => ({
      resource: BigInt(keccak256(encodePacked(['uint256'], [BigInt(coin)]))),
      role: ADDRESS_ROLE,
    })),
  ...PROFILE_RECORD_KEYS.texts.map(key => ({ resource: BigInt(keccak256(stringToHex(key))), role: TEXT_ROLE })),
];

/**
 * Reads the active wallet's resolver authority independently of name ownership.
 */
export function readEnsPermissions(inputName: string, account: Address, signal?: AbortSignal) {
  const name = normalizeEnsName(inputName);

  return withEnsClient(async client => {
    const resolver = await getEnsWriteResolver(client, name);
    if (!resolver?.permissioned) {
      const canEditRecords = resolver ? await canWriteLegacyRecords(client, resolver.address, name, account) : false;
      return { resolver, canEditRecords, canSetAddress: canEditRecords, canClearRecords: canEditRecords };
    }

    const roles = await readContract(client, { address: resolver.address, abi: resolverAbi, functionName: 'roles', args: [0n, account] });
    const canSetAddress =
      (roles & ADDRESS_ROLE) !== 0n ||
      (await readContract(client, {
        address: resolver.address,
        abi: resolverAbi,
        functionName: 'hasRoles',
        args: [ETH_ADDRESS_RESOURCE, ADDRESS_ROLE, account],
      }));

    let canEditRecords = canSetAddress || (roles & (ADDRESS_ROLE | TEXT_ROLE | CONTENTHASH_ROLE)) !== 0n;
    if (!canEditRecords) {
      const permissions = await multicall(client, {
        allowFailure: false,
        contracts: OTHER_RECORD_PERMISSIONS.map(
          permission =>
            ({
              address: resolver.address,
              abi: resolverAbi,
              functionName: 'hasRoles',
              args: [permission.resource, permission.role, account],
            }) satisfies ContractFunctionParameters<typeof resolverAbi, 'view', 'hasRoles'>
        ),
      });
      canEditRecords = permissions.some(Boolean);
    }

    return { resolver, canEditRecords, canSetAddress, canClearRecords: (roles & CLEAR_RECORDS_ROLES) === CLEAR_RECORDS_ROLES };
  }, signal);
}

async function canWriteLegacyRecords(client: EnsClient, resolver: Address, name: string, account: Address): Promise<boolean> {
  try {
    await simulateContract(client, {
      account,
      address: resolver,
      abi: legacyAbi,
      functionName: 'setText',
      args: [namehash(name), 'name', ''],
    });
    return true;
  } catch (error) {
    const revert = error instanceof BaseError && error.walk(cause => cause instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) return false;

    throw error;
  }
}
