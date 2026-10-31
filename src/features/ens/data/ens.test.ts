import {
  concat,
  decodeFunctionData,
  encodeAbiParameters,
  encodeErrorResult,
  encodeFunctionData,
  encodeFunctionResult,
  offchainLookupAbiItem,
  parseAbi,
  slice,
  toFunctionSelector,
  type Address,
  type Hex,
} from 'viem';
import { mainnet } from 'viem/chains';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';

import { ETHEREUM_COIN_TYPE, readEnsRecords, resolveEnsAddress, resolveEnsName } from './ens';

type RpcFailure = { code: number; message: string; data?: Hex | { data: Hex } };
type RpcCall = { id: number; method: string; params: [{ to: Address; data: Hex }, string] };

vi.mock('@/features/network/stores/backendNetworksStore', () => ({
  backendNetworksActions: { getChainDefaultRpc: () => 'https://fixture.invalid/rpc' },
}));

const RPC_URL = 'https://fixture.invalid/rpc';
const GATEWAY_URL = 'https://ccip-v3.ens.xyz';
const RESOLVER = '0x1111111111111111111111111111111111111111' satisfies Address;
const DESTINATION = '0x2222222222222222222222222222222222222222' satisfies Address;
const UNIVERSAL_RESOLVER = mainnet.contracts.ensUniversalResolver.address;
const EXTRA_DATA = '0xaabbcc';
const CALLBACK_ABI = parseAbi(['function callback(bytes response, bytes extraData) view returns (bytes)']);
const BATCH_ABI = parseAbi([
  'function query((address sender,string[] urls,bytes data)[] queries) view returns(bool[] failures,bytes[] responses)',
]);
const RECORDS_ABI = parseAbi([
  'function multicall(bytes[] data) view returns(bytes[])',
  'function text(bytes32 node,string key) view returns(string)',
  'function addr(bytes32 node) view returns(address)',
  'function addr(bytes32 node,uint256 coinType) view returns(bytes)',
  'function contenthash(bytes32 node) view returns(bytes)',
  'error UnsupportedResolverProfile(bytes4 selector)',
  'error ResolverError(bytes errorData)',
]);
const RESOLVER_ABI = parseAbi([
  'function resolveWithGateways(bytes name,bytes data,string[] gateways) view returns(bytes result,address resolver)',
  'function reverseWithGateways(bytes lookupAddress,uint256 coinType,string[] gateways) view returns(string name,address resolver,address reverseResolver)',
]);
const CALLBACK_SELECTOR = toFunctionSelector('callback(bytes,bytes)');
const EMPTY_BATCH = encodeFunctionData({ abi: BATCH_ABI, functionName: 'query', args: [[]] });
const EMPTY_BATCH_RESULT = encodeFunctionResult({ abi: BATCH_ABI, functionName: 'query', result: [[], []] });
const ADDRESS_RESULT = encodeFunctionResult({
  abi: RESOLVER_ABI,
  functionName: 'resolveWithGateways',
  result: [encodeAbiParameters([{ type: 'address' }], [DESTINATION]), RESOLVER],
});

function offchainLookup(data: Hex = EMPTY_BATCH, sender: Address = UNIVERSAL_RESOLVER): RpcFailure {
  return {
    code: 3,
    message: 'execution reverted',
    data: encodeErrorResult({
      abi: [offchainLookupAbiItem],
      errorName: 'OffchainLookup',
      args: [sender, ['x-batch-gateway:true'], data, CALLBACK_SELECTOR, EXTRA_DATA],
    }),
  };
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
}

const fetchMock = vi.spyOn(global, 'fetch');
let replies: (Hex | RpcFailure)[];
let rpcCalls: RpcCall[];
let gatewayBodies: { sender: Address; data: Hex }[];
let signals: (AbortSignal | null | undefined)[];

async function respond(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  signals.push(init?.signal);
  if (input === GATEWAY_URL) {
    gatewayBodies.push(JSON.parse(String(init?.body)));
    return jsonResponse({ data: EMPTY_BATCH_RESULT });
  }
  expect(input).toBe(RPC_URL);
  const request: RpcCall = JSON.parse(String(init?.body));
  expect(request.method).toBe('eth_call');
  expect(request.params[0].to.toLowerCase()).toBe(UNIVERSAL_RESOLVER.toLowerCase());
  rpcCalls.push(request);
  const reply = replies.shift();
  if (reply === undefined) throw new Error('Unexpected RPC request');
  return jsonResponse({ jsonrpc: '2.0', id: request.id, ...(typeof reply === 'string' ? { result: reply } : { error: reply }) });
}

beforeEach(() => {
  replies = [];
  rpcCalls = [];
  gatewayBodies = [];
  signals = [];
  fetchMock.mockReset().mockImplementation(respond);
});

afterAll(() => fetchMock.mockRestore());

describe('ENS CCIP continuation', () => {
  it.each([0, 1, 8])('completes after %i lookups and preserves the callback arguments', async lookups => {
    replies = [...Array.from({ length: lookups }, () => offchainLookup()), ADDRESS_RESULT];

    await expect(resolveEnsAddress('alice.eth', ChainId.mainnet)).resolves.toBe(DESTINATION);

    expect(rpcCalls).toHaveLength(lookups + 1);
    expect(gatewayBodies).toHaveLength(lookups);
    const callback = encodeFunctionData({ abi: CALLBACK_ABI, functionName: 'callback', args: [EMPTY_BATCH_RESULT, EXTRA_DATA] });
    for (const request of rpcCalls.slice(1)) {
      expect(request.params[0].data).toBe(callback);
      expect(request.params[1]).toBe('latest');
    }
    expect(signals.every(signal => signal === signals[0])).toBe(true);
    expect(signals[0]).toBeDefined();
  });

  it('rejects a ninth lookup before another gateway request', async () => {
    replies = Array.from({ length: 9 }, () => offchainLookup());

    await expect(resolveEnsAddress('alice.eth', ChainId.mainnet)).rejects.toThrow('ENS lookup exceeded its CCIP request limit');

    expect(rpcCalls).toHaveLength(9);
    expect(gatewayBodies).toHaveLength(8);
  });

  it('rejects a sender mismatch before contacting the gateway', async () => {
    replies = [offchainLookup(EMPTY_BATCH, RESOLVER)];

    await expect(resolveEnsAddress('alice.eth', ChainId.mainnet)).rejects.toThrow('CCIP lookup sender does not match');

    expect(rpcCalls).toHaveLength(1);
    expect(gatewayBodies).toHaveLength(0);
  });

  it.each([
    ['alice.eth', 'alice.eth'],
    [' alice.eth ', null],
    ['ALICE.eth', null],
  ] as const)('verifies the reverse name %s through nested RPC revert data', async (name, expected) => {
    const lookup = offchainLookup();
    if (typeof lookup.data !== 'string') throw new Error('Expected encoded lookup');
    replies = [
      { ...lookup, data: { data: lookup.data } },
      encodeFunctionResult({ abi: RESOLVER_ABI, functionName: 'reverseWithGateways', result: [name, RESOLVER, RESOLVER] }),
    ];

    await expect(resolveEnsName(DESTINATION, ChainId.base)).resolves.toBe(expected);

    const request = decodeFunctionData({ abi: RESOLVER_ABI, data: rpcCalls[0].params[0].data });
    expect(request.args[1]).toBe(2147492101n);
    expect(gatewayBodies).toHaveLength(1);
  });

  it.each([
    { code: -32000, message: 'RPC unavailable' },
    { code: 3, message: 'execution reverted', data: '0x556f1830' },
  ] satisfies RpcFailure[])('does not continue an unrelated or malformed error: $message', async error => {
    replies = [error];

    await expect(resolveEnsAddress('alice.eth', ChainId.mainnet)).rejects.toThrow();

    expect(rpcCalls).toHaveLength(1);
    expect(gatewayBodies).toHaveLength(0);
  });

  it('does not decode another error as OffchainLookup when its arguments match', async () => {
    const lookup = offchainLookup();
    if (typeof lookup.data !== 'string') throw new Error('Expected encoded lookup');
    replies = [{ ...lookup, data: concat(['0xdeadbeef', slice(lookup.data, 4)]) }];

    await expect(resolveEnsAddress('alice.eth', ChainId.mainnet)).rejects.toThrow();

    expect(rpcCalls).toHaveLength(1);
    expect(gatewayBodies).toHaveLength(0);
  });

  it('keeps eleven offchain record requests in one gateway batch', async () => {
    const texts = Array.from({ length: 10 }, (_, i) => `field${i}`);
    const batch = encodeFunctionData({
      abi: BATCH_ABI,
      functionName: 'query',
      args: [Array.from({ length: 11 }, () => ({ sender: RESOLVER, urls: ['https://resolver.invalid'], data: '0x1234' }) as const)],
    });
    const values = [
      ...texts.map(() => encodeAbiParameters([{ type: 'string' }], ['value'])),
      encodeAbiParameters([{ type: 'bytes' }], ['0x']),
    ];
    replies = [
      offchainLookup(batch),
      encodeFunctionResult({
        abi: RESOLVER_ABI,
        functionName: 'resolveWithGateways',
        result: [encodeFunctionResult({ abi: RECORDS_ABI, functionName: 'multicall', result: values }), RESOLVER],
      }),
    ];

    await expect(readEnsRecords('alice.eth', { texts, coins: [] })).resolves.toEqual({
      texts: Object.fromEntries(texts.map(key => [key, 'value'])),
      coins: {},
      contentHash: null,
    });

    expect(gatewayBodies).toHaveLength(1);
    expect(gatewayBodies[0].sender.toLowerCase()).toBe(UNIVERSAL_RESOLVER.toLowerCase());
    expect(gatewayBodies[0].data).toBe(batch);
    expect(rpcCalls).toHaveLength(2);
  });

  it('makes no request for an already cancelled operation', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(resolveEnsAddress('alice.eth', ChainId.mainnet, controller.signal)).rejects.toThrow('ENS lookup cancelled');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([RPC_URL, GATEWAY_URL])('cancels an in-flight request to %s', async target => {
    replies = [offchainLookup()];
    const controller = new AbortController();
    const started = Promise.withResolvers<void>();
    let requestSignal: AbortSignal | null | undefined;
    fetchMock.mockImplementation(async (input, init) => {
      if (input !== target) return respond(input, init);
      requestSignal = init?.signal;
      started.resolve();
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
      });
    });
    const pending = resolveEnsAddress('alice.eth', ChainId.mainnet, controller.signal);
    await started.promise;
    controller.abort();

    await expect(pending).rejects.toThrow();
    expect(requestSignal?.aborted).toBe(true);
    expect(rpcCalls).toHaveLength(target === RPC_URL ? 0 : 1);
  });
});

describe('ENS record decoding', () => {
  it('preserves text, checksummed Ethereum addresses, coin bytes, and explicitly unsupported contenthash', async () => {
    const address = '0x52908400098527886E0F7030069857D2E4169EE7';
    const values = [
      encodeFunctionResult({ abi: RECORDS_ABI, functionName: 'text', result: 'Alice' }),
      encodeAbiParameters([{ type: 'address' }], [address]),
      encodeAbiParameters([{ type: 'bytes' }], ['0x1234']),
      encodeErrorResult({ abi: RECORDS_ABI, errorName: 'UnsupportedResolverProfile', args: ['0xbc1c58d1'] }),
    ];
    replies = [recordResults(values)];

    await expect(readEnsRecords('alice.eth', { texts: ['name'], coins: [ETHEREUM_COIN_TYPE, 0] })).resolves.toEqual({
      texts: { name: 'Alice' },
      coins: { 60: address, 0: '0x1234' },
      contentHash: null,
    });

    const request = decodeFunctionData({ abi: RESOLVER_ABI, data: rpcCalls[0].params[0].data });
    if (request.functionName !== 'resolveWithGateways') throw new Error('Expected record lookup');
    const batch = decodeFunctionData({ abi: RECORDS_ABI, data: request.args[1] });
    if (batch.functionName !== 'multicall') throw new Error('Expected record batch');
    expect(batch.args[0].map(data => decodeFunctionData({ abi: RECORDS_ABI, data }))).toMatchObject([
      { functionName: 'text', args: [expect.any(String), 'name'] },
      { functionName: 'addr', args: [expect.any(String)] },
      { functionName: 'addr', args: [expect.any(String), 0n] },
      { functionName: 'contenthash', args: [expect.any(String)] },
    ]);
  });

  it.each(['0x', encodeErrorResult({ abi: RECORDS_ABI, errorName: 'ResolverError', args: ['0x1234'] })] satisfies Hex[])(
    'rejects failed or undecodable contenthash instead of treating it as absent: %s',
    async contentHash => {
      replies = [recordResults([contentHash])];

      await expect(readEnsRecords('alice.eth', { texts: [], coins: [] })).rejects.toThrow();
    }
  );
});

function recordResults(values: readonly Hex[]): Hex {
  return encodeFunctionResult({
    abi: RESOLVER_ABI,
    functionName: 'resolveWithGateways',
    result: [encodeFunctionResult({ abi: RECORDS_ABI, functionName: 'multicall', result: values }), RESOLVER],
  });
}
