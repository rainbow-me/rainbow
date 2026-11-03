import { nullObject } from '@storesjs/stores';
import * as AbiFunction from 'ox/AbiFunction';
import { BaseError, ContractFunctionRevertedError, getAddress, parseAbi, size, toHex, zeroAddress, type Address, type Hex } from 'viem';
import { getEnsAddress, getEnsName, getEnsText, readContract } from 'viem/actions';
import { mainnet } from 'viem/chains';
import { namehash, packetToBytes, toCoinType } from 'viem/ens';

import { ChainId } from '@/features/network/types/backendNetworks';

import { normalizeEnsName } from '../core/name';
import { ETHEREUM_COIN_TYPE } from '../core/records';
import { withEnsClient, type EnsClient } from './client';

// ============ Types ========================================================== //

/**
 * Fields to read together from one name. Contenthash is always included.
 */
export type EnsRecordKeys = {
  texts: readonly string[];
  coins: readonly number[];
};

/**
 * Public records keyed by the requested fields.
 * Coin addresses and contenthash are encoded bytes, not display strings or URLs.
 */
type EnsRecords = {
  texts: Record<string, string | null>;
  coins: Record<number, Hex | null>;
  contentHash: Hex | null;
};

// ============ Constants ====================================================== //

const ABI_WORD_BYTES = 32;

const COIN_ADDRESS_RECORD = AbiFunction.from('function addr(bytes32 node, uint256 coinType) view returns (bytes)');
const CONTENT_HASH_RECORD = AbiFunction.from('function contenthash(bytes32 node) view returns (bytes)');
const ETH_ADDRESS_RECORD = AbiFunction.from('function addr(bytes32 node) view returns (address)');
const MULTICALL = AbiFunction.from('function multicall(bytes[] data) view returns (bytes[])');
const TEXT_RECORD = AbiFunction.from('function text(bytes32 node, string key) view returns (string)');

const UNIVERSAL_RESOLVER_ABI = parseAbi([
  'error ResolverNotFound(bytes name)',
  'error ResolverNotContract(bytes name, address resolver)',
  'error UnsupportedResolverProfile(bytes4 selector)',
  'error ResolverError(bytes errorData)',
  'error HttpError(uint16 status, string message)',
  'function resolveWithGateways(bytes name, bytes data, string[] gateways) view returns (bytes result, address resolver)',
]);

// ============ ENS Reads ====================================================== //

/**
 * Resolves a name to its address on the destination chain.
 *
 * Missing records return null; lookup failures reject. The resolver owns
 * cross-chain fallback.
 */
export async function resolveEnsAddress(name: string, chainId: ChainId, signal?: AbortSignal): Promise<Address | null> {
  const normalizedName = normalizeEnsName(name);
  const coinType = chainId === ChainId.mainnet ? undefined : toCoinType(chainId);
  const address = await readEns(client => getEnsAddress(client, { name: normalizedName, coinType, strict: true }), signal);
  return address === null || coinType === undefined ? address : getAddress(address);
}

/**
 * Finds an address's ENS name on the requested chain.
 *
 * The name must resolve back to that address and already use normalized ENS
 * spelling. Missing or unverified names return null; lookup failures reject.
 */
export async function resolveEnsName(address: Address, chainId: ChainId, signal?: AbortSignal): Promise<string | null> {
  try {
    const name = await readEns(client => getEnsName(client, { address, coinType: toCoinType(chainId), strict: true }), signal);
    if (name === null) return null;

    try {
      return normalizeEnsName(name) === name ? name : null;
    } catch {
      return null;
    }
  } catch (error) {
    if (hasResolverError(error, 'ReverseAddressMismatch')) return null;
    throw error;
  }
}

/**
 * Reads one text record through the same bounded ENS resolution path.
 */
export async function readEnsText(name: string, key: string, signal?: AbortSignal): Promise<string | null> {
  const normalizedName = normalizeEnsName(name);
  return readEns(client => getEnsText(client, { name: normalizedName, key, strict: true }), signal);
}

/**
 * Reads the requested text and coin records together with contenthash.
 *
 * Unset records and explicitly unsupported methods become null. Other reported
 * errors and undecodable results reject the read. Returns null when no resolver
 * exists.
 */
export async function readEnsRecords(name: string, keys: EnsRecordKeys, signal?: AbortSignal): Promise<EnsRecords | null> {
  const normalizedName = normalizeEnsName(name);
  const node = namehash(normalizedName);
  const dnsName = toHex(packetToBytes(normalizedName));
  const calls: Hex[] = [];

  for (const key of keys.texts) calls.push(AbiFunction.encodeData(TEXT_RECORD, [node, key]));
  for (const coinType of keys.coins) {
    calls.push(
      coinType === ETHEREUM_COIN_TYPE
        ? AbiFunction.encodeData(ETH_ADDRESS_RECORD, [node])
        : AbiFunction.encodeData(COIN_ADDRESS_RECORD, [node, BigInt(coinType)])
    );
  }

  calls.push(AbiFunction.encodeData(CONTENT_HASH_RECORD, [node]));

  const values = await readEns(client => readRecordBatch(client, dnsName, calls), signal);
  if (values === null) return null;

  const texts: EnsRecords['texts'] = nullObject();
  const coins: EnsRecords['coins'] = nullObject();
  let index = 0;

  for (const key of keys.texts) {
    texts[key] = decodeRecord(values[index], decodeText);
    index += 1;
  }

  for (const coinType of keys.coins) {
    coins[coinType] = decodeRecord(values[index], coinType === ETHEREUM_COIN_TYPE ? decodeEthAddress : decodeCoinAddress);
    index += 1;
  }

  return { texts, coins, contentHash: decodeRecord(values[index], decodeContentHash) };
}

// ============ Resolution Outcomes =========================================== //

async function readEns<T>(read: (client: EnsClient) => Promise<T>, signal?: AbortSignal): Promise<T | null> {
  try {
    return await withEnsClient(read, signal);
  } catch (error) {
    if (hasResolverError(error, 'ResolverNotFound')) return null;
    throw error;
  }
}

function hasResolverError(error: unknown, name: string): boolean {
  if (!(error instanceof BaseError)) return false;
  const cause = error.walk(isContractFunctionRevertedError);
  return isContractFunctionRevertedError(cause) && cause.data?.errorName === name;
}

// ============ Record Batches ================================================= //

async function readRecordBatch(client: EnsClient, dnsName: Hex, calls: readonly Hex[]): Promise<readonly Hex[]> {
  const data = AbiFunction.encodeData(MULTICALL, [calls]);
  const [result] = await readContract(client, {
    address: mainnet.contracts.ensUniversalResolver.address,
    abi: UNIVERSAL_RESOLVER_ABI,
    functionName: 'resolveWithGateways',
    args: [dnsName, data, ['x-batch-gateway:true']],
  });

  const values = AbiFunction.decodeResult(MULTICALL, result);
  if (values.length === calls.length) return values;

  throw new Error('ENS returned an incomplete record batch');
}

// ============ Decoding ======================================================= //

/**
 * Decodes a Smart Multicall record, distinguishing values from reported errors.
 * Unsupported methods return null; other errors retain their resolver diagnostics.
 */
function decodeRecord<T>(data: Hex, decode: (data: Hex) => T): T | null {
  const isRecordError = size(data) % ABI_WORD_BYTES !== 0;
  if (!isRecordError) return decode(data);

  const error = new ContractFunctionRevertedError({ abi: UNIVERSAL_RESOLVER_ABI, data, functionName: 'resolveWithGateways' });
  if (error.data?.errorName === 'UnsupportedResolverProfile') return null;

  throw error;
}

function decodeText(data: Hex): string | null {
  return AbiFunction.decodeResult(TEXT_RECORD, data) || null;
}

function decodeEthAddress(data: Hex): Address | null {
  const address = AbiFunction.decodeResult(ETH_ADDRESS_RECORD, data);
  return address === zeroAddress ? null : getAddress(address);
}

function decodeCoinAddress(data: Hex): Hex | null {
  const address = AbiFunction.decodeResult(COIN_ADDRESS_RECORD, data);
  return address === '0x' ? null : address;
}

function decodeContentHash(data: Hex): Hex | null {
  const hash = AbiFunction.decodeResult(CONTENT_HASH_RECORD, data);
  return hash === '0x' ? null : hash;
}

// ============ Error Classification =========================================== //

function isContractFunctionRevertedError(error: unknown): error is ContractFunctionRevertedError {
  return error instanceof ContractFunctionRevertedError;
}
