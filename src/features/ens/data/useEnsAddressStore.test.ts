import { encodeAbiParameters, encodeFunctionResult, parseAbi } from 'viem';
import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';

import { useEnsAddressStore } from './useEnsAddressStore';

vi.mock('@/features/network/stores/backendNetworksStore', () => ({
  backendNetworksActions: { getChainDefaultRpc: () => 'https://fixture.invalid/rpc' },
}));

const ADDRESS = '0x52908400098527886E0F7030069857D2E4169EE7';
const RESOLVER_ABI = parseAbi([
  'function resolveWithGateways(bytes name,bytes data,string[] gateways) view returns(bytes result,address resolver)',
]);
const fetchMock = vi.spyOn(global, 'fetch');

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset().mockRejectedValue(new Error('Unexpected ENS request'));
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

afterAll(() => {
  fetchMock.mockRestore();
});

it.each([ADDRESS, ADDRESS.toLowerCase()])('preserves the raw profile address %s without an ENS request', async addressOrName => {
  await expect(useEnsAddressStore.getState().refresh({ addressOrName, chainId: ChainId.mainnet })).resolves.toBe(ADDRESS);

  expect(fetchMock).not.toHaveBeenCalled();
});

it('resolves profile names and shares the result with imperative prefetchers', async () => {
  fetchMock.mockImplementation(async (_url, init) => {
    const { id }: { id: number } = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id,
        result: encodeFunctionResult({
          abi: RESOLVER_ABI,
          functionName: 'resolveWithGateways',
          result: [encodeAbiParameters([{ type: 'address' }], [ADDRESS]), ADDRESS],
        }),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  });

  await expect(useEnsAddressStore.getState().refresh({ addressOrName: 'alice.eth', chainId: ChainId.mainnet })).resolves.toBe(ADDRESS);

  const input = { addressOrName: 'alice.eth', chainId: ChainId.mainnet };
  await useEnsAddressStore.getState().fetch({ inputs: [input] }, { skipStoreUpdates: 'withCache', throwOnError: true });
  expect(useEnsAddressStore.getState().get(input)).toBe(ADDRESS);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toBe('https://fixture.invalid/rpc');
});
