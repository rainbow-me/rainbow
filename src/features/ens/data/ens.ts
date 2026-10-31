import { nullObject } from '@storesjs/stores';
import * as AbiError from 'ox/AbiError';
import * as AbiFunction from 'ox/AbiFunction';
import {
  BaseError,
  ccipReadTunnel,
  ccipRequest,
  concat,
  ContractFunctionRevertedError,
  createClient,
  encodeAbiParameters,
  getAddress,
  http,
  isAddressEqual,
  isHex,
  offchainLookupAbiItem,
  offchainLookupSignature,
  parseAbi,
  RpcRequestError,
  size,
  toHex,
  zeroAddress,
  type Address,
  type Client,
  type Hex,
  type Transport,
} from 'viem';
import { call, getEnsAddress, getEnsName, readContract, type CallParameters, type CallReturnType } from 'viem/actions';
import { mainnet } from 'viem/chains';
import { namehash, packetToBytes, toCoinType } from 'viem/ens';

import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';

import { normalizeEnsName } from '../core/name';

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
export type EnsRecords = {
  texts: Record<string, string | null>;
  coins: Record<number, Hex | null>;
  contentHash: Hex | null;
};

type EnsClient = Client<Transport, typeof mainnet>;

// ============ Constants ====================================================== //

/**
 * ENS coin type for Ethereum, read through the legacy addr(bytes32) record.
 */
export const ETHEREUM_COIN_TYPE = 60;

const BATCH_GATEWAYS = ['https://ccip-v3.ens.xyz'];
const LOOKUP_TIMEOUT_MS = time.seconds(15);
const MAX_CCIP_LOOKUPS = 8;

const ABI_WORD_BYTES = 32;
const ABI_ENCODE_PARAMS = [{ type: 'bytes' }, { type: 'bytes' }] as const;
const OFFCHAIN_LOOKUP_ERROR = AbiError.from(offchainLookupAbiItem);

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
  const address = await withEnsClient(client => getEnsAddress(client, { name: normalizedName, coinType, strict: true }), signal);
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
    const name = await withEnsClient(client => getEnsName(client, { address, coinType: toCoinType(chainId), strict: true }), signal);
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

  const values = await withEnsClient(client => readRecordBatch(client, dnsName, calls), signal);
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

// ============ RPC and CCIP =================================================== //

async function withEnsClient<T>(read: (client: EnsClient) => Promise<T>, signal?: AbortSignal): Promise<T | null> {
  if (signal?.aborted) throw new Error('ENS lookup cancelled');

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, LOOKUP_TIMEOUT_MS);

  try {
    const base = createClient({
      chain: mainnet,
      ccipRead: false,
      transport: http(backendNetworksActions.getChainDefaultRpc(ChainId.mainnet), { retryCount: 0, timeout: 0 }),
    });

    const gateway = ccipReadTunnel({
      batchGateways: BATCH_GATEWAYS,
      ccipRequest: parameters => ccipRequest({ ...parameters, requestOptions: { signal: controller.signal } }),
    });

    const client = base.extend(() => ({
      call: (parameters: CallParameters<typeof mainnet>) => callWithCcip(base, parameters, gateway.request, controller.signal),
    }));

    return await read(client);
  } catch (error) {
    if (hasResolverError(error, 'ResolverNotFound')) return null;
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

/**
 * Completes a contract read through bounded CCIP callbacks.
 *
 * Each gateway reply must pass its contract callback, including the final
 * allowed lookup.
 */
async function callWithCcip(
  client: EnsClient,
  parameters: CallParameters<typeof mainnet>,
  requestGateway: typeof ccipRequest,
  signal: AbortSignal
): Promise<CallReturnType> {
  let data = parameters.data;
  const requestOptions = { ...parameters.requestOptions, signal };

  for (let lookups = 0; ; lookups += 1) {
    if (signal.aborted) throw new Error('ENS lookup cancelled');

    try {
      return await call(client, { ...parameters, data, requestOptions });
    } catch (error) {
      const revertData = getRevertData(error);
      if (!parameters.to || !revertData?.startsWith(offchainLookupSignature)) throw error;

      const { sender, urls, callData, callbackFunction, extraData } = AbiError.decode(OFFCHAIN_LOOKUP_ERROR, revertData, { as: 'Object' });

      if (!isAddressEqual(sender, parameters.to)) throw new Error('CCIP lookup sender does not match the called contract');
      if (lookups === MAX_CCIP_LOOKUPS) throw new Error('ENS lookup exceeded its CCIP request limit');

      const response = await requestGateway({ sender, urls, data: callData });
      data = concat([callbackFunction, encodeAbiParameters(ABI_ENCODE_PARAMS, [response, extraData])]);
    }
  }
}

/**
 * Extracts direct or nested revert bytes from this client's HTTP RPC error.
 */
function getRevertData(error: unknown): Hex | undefined {
  if (!(error instanceof BaseError)) return undefined;

  const cause = error.walk(isRpcRequestError);
  if (!isRpcRequestError(cause)) return undefined;

  const payload = cause.data;
  const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;

  return isHex(data, { strict: true }) ? data : undefined;
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

function isRpcRequestError(error: unknown): error is RpcRequestError {
  return error instanceof RpcRequestError;
}
