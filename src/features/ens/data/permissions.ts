import { formatsByName } from '@ensdomains/address-encoder';
import { BaseError, ContractFunctionRevertedError, encodePacked, keccak256, stringToHex, type Address } from 'viem';
import { multicall, readContract, simulateContract } from 'viem/actions';
import { namehash } from 'viem/ens';

import { normalizeEnsName } from '../core/name';
import { ENS_RECORDS, ETHEREUM_COIN_TYPE } from '../core/records';
import { withEnsClient, type EnsClient } from './client';
import { legacyAbi, resolverAbi } from './contracts';
import { getEnsWriteResolver } from './resolver';

const ADDRESS_ROLE = 1n;
const TEXT_ROLE = 1n << 4n;
const CONTENTHASH_ROLE = 1n << 8n;
const CLEAR_RECORDS_ROLES = (1n << 28n) | CONTENTHASH_ROLE;
const ETH_ADDRESS_RESOURCE = BigInt(keccak256(encodePacked(['uint256'], [BigInt(ETHEREUM_COIN_TYPE)])));

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
      const fields = Object.values(ENS_RECORDS).filter(key => key !== ENS_RECORDS.contenthash);
      const permissions = await multicall(client, {
        allowFailure: false,
        contracts: fields.map(key => {
          const coin = formatsByName[key];
          const resource = keccak256(coin ? encodePacked(['uint256'], [BigInt(coin.coinType)]) : stringToHex(key));
          return {
            address: resolver.address,
            abi: resolverAbi,
            functionName: 'hasRoles' as const,
            args: [BigInt(resource), coin ? ADDRESS_ROLE : TEXT_ROLE, account] as const,
          };
        }),
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
    if (
      error instanceof BaseError &&
      error.walk(cause => cause instanceof ContractFunctionRevertedError) instanceof ContractFunctionRevertedError
    )
      return false;
    throw error;
  }
}
