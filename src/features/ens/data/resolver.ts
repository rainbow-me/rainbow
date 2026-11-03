import { formatsByName } from '@ensdomains/address-encoder';
import { encodeFunctionData, isAddressEqual, toHex, zeroAddress, type Address, type Hex } from 'viem';
import { getEnsResolver, readContract } from 'viem/actions';
import { namehash, packetToBytes } from 'viem/ens';

import { ensClient } from '@/graphql';

import { encodeContenthash } from '../core/contenthash';
import { ensContracts } from '../core/contracts';
import { ENS_RECORDS, ETHEREUM_COIN_TYPE } from '../core/records';
import type { Records } from '../types/registration';
import type { EnsClient } from './client';
import { compositeResolverAbi, legacyAbi, resolverAbi, supportsInterface } from './contracts';
import { readEnsRecords } from './ens';
import { PROFILE_RECORD_KEYS } from './recordKeys';

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

/**
 * Encodes record changes for the resolver's setter API.
 * Empty values clear records; legacy ETH records require the zero address.
 */
export function encodeEnsRecordWrites(name: string, records: Records, permissioned: boolean): Hex[] {
  const abi = permissioned ? resolverAbi : legacyAbi;
  const encodedName = permissioned ? toHex(packetToBytes(name)) : namehash(name);
  const calls: Hex[] = [];

  for (const key in records) {
    const value = records[key];
    if (value === undefined) continue;

    const coin = formatsByName[key];
    if (coin) {
      let bytes: Hex = '0x';
      if (value) bytes = toHex(coin.decoder(value));
      else if (!permissioned && coin.coinType === ETHEREUM_COIN_TYPE) bytes = zeroAddress;

      calls.push(
        encodeFunctionData({
          abi,
          functionName: permissioned ? 'setAddress' : 'setAddr',
          args: [encodedName, BigInt(coin.coinType), bytes],
        })
      );
    } else if (key === ENS_RECORDS.contenthash) {
      const bytes = value ? encodeContenthash(value) : '0x';
      if (bytes === null) throw new Error('Invalid ENS contenthash');

      calls.push(encodeFunctionData({ abi, functionName: 'setContenthash', args: [encodedName, bytes] }));
    } else {
      calls.push(encodeFunctionData({ abi, functionName: 'setText', args: [encodedName, key, value] }));
    }
  }

  return calls;
}

/**
 * Detaches just this name from its old bundle, including an inherited default.
 * The empty contenthash write creates a new bundle, preventing default fallback.
 */
export function encodeEnsRecordClear(name: string): Hex[] {
  const dnsName = toHex(packetToBytes(name));
  return [
    encodeFunctionData({ abi: resolverAbi, functionName: 'linkToRecord', args: [dnsName, 0n] }),
    encodeFunctionData({ abi: resolverAbi, functionName: 'setContenthash', args: [dnsName, '0x'] }),
  ];
}

/**
 * Clears legacy records by their native keys, including indexed coin types
 * Rainbow cannot display. Contenthash has no indexed key.
 */
export async function getLegacyRecordClears(name: string, resolver: Address): Promise<Hex[]> {
  const node = namehash(name);
  const [index, known] = await Promise.all([
    ensClient.getResolverKeys({ resolver: resolver.toLowerCase(), node }),
    readEnsRecords(name, PROFILE_RECORD_KEYS),
  ]);
  const indexed = index.resolvers[0];
  const texts = new Set(indexed?.texts);
  const coins = new Set<bigint>(indexed?.coinTypes?.map(coin => BigInt(coin)));
  for (const key in known?.texts) if (known.texts[key] !== null) texts.add(key);
  for (const coin in known?.coins) if (known.coins[Number(coin)] !== null) coins.add(BigInt(coin));

  const calls: Hex[] = [];
  for (const key of texts) calls.push(encodeFunctionData({ abi: legacyAbi, functionName: 'setText', args: [node, key, ''] }));
  for (const coin of coins)
    calls.push(
      encodeFunctionData({
        abi: legacyAbi,
        functionName: 'setAddr',
        args: [node, coin, coin === BigInt(ETHEREUM_COIN_TYPE) ? zeroAddress : '0x'],
      })
    );
  if (known?.contentHash) calls.push(encodeFunctionData({ abi: legacyAbi, functionName: 'setContenthash', args: [node, '0x'] }));
  return calls;
}
