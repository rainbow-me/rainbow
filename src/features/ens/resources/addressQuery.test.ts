import { encodeAbiParameters, encodeFunctionResult, parseAbi } from 'viem';

import { ChainId } from '@/features/network/types/backendNetworks';
import { queryClient } from '@/react-query/queryClient';

import { fetchENSAddress } from './addressQuery';

jest.mock('@/react-query/queryClient', () => {
  const { QueryClient } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } }) };
});

jest.mock('@/features/network/stores/backendNetworksStore', () => ({
  backendNetworksActions: { getChainDefaultRpc: () => 'https://fixture.invalid/rpc' },
}));

const ADDRESS = '0x52908400098527886E0F7030069857D2E4169EE7';
const RESOLVER_ABI = parseAbi([
  'function resolveWithGateways(bytes name,bytes data,string[] gateways) view returns(bytes result,address resolver)',
]);
const fetchMock = jest.spyOn(global, 'fetch');

beforeEach(() => {
  queryClient.clear();
  fetchMock.mockReset().mockRejectedValue(new Error('Unexpected ENS request'));
});

afterAll(() => {
  queryClient.clear();
  fetchMock.mockRestore();
});

it.each([ADDRESS, ADDRESS.toLowerCase()])('preserves the raw profile address %s without an ENS request', async addressOrName => {
  await expect(fetchENSAddress({ addressOrName, chainId: ChainId.mainnet })).resolves.toBe(ADDRESS);

  expect(fetchMock).not.toHaveBeenCalled();
});

it('resolves profile names through ENS', async () => {
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

  await expect(fetchENSAddress({ addressOrName: 'alice.eth', chainId: ChainId.mainnet })).resolves.toBe(ADDRESS);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toBe('https://fixture.invalid/rpc');
});
